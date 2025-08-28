import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ToolDefinition, WizardStep, Action } from '../types';
import { apiClient } from './ApiClient';
import { useInterval } from './UseInterval';
import { checkDisplayCondition } from '../utils/conditions';

interface ToolState {
  runId: string | null;
  toolDefinition: ToolDefinition | null;
  currentStep: WizardStep | null;
  formData: Record<string, any>;
  jobResults: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  stepHistory: string[];
  validationErrors: Record<string, string>;
  loadTool: (toolId: string) => Promise<void>;
  updateFormField: (fieldId: string, value: any) => void;
  mergeFormData: (data: Record<string, any>) => void;
  executeAction: (action: Action) => Promise<void>;
  goBack: () => void;
  resetTool: () => void;
}

const ToolContext = createContext<ToolState | undefined>(undefined);


export const ToolProvider = ({ children }: { children: ReactNode }) => {
  const [runId, setRunId] = useState<string | null>(null);
  const [toolDefinition, setToolDefinition] = useState<ToolDefinition | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [jobResults, setJobResults] = useState<Record<string, any>>({});
  const [pollingActionId, setPollingActionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [pollingAction, setPollingAction] = useState<Action | null>(null);

  const resetTool = useCallback(() => {
    setRunId(null);
    setToolDefinition(null);
    setCurrentStepId(null);
    setFormData({});
    setJobResults({});
    setPollingActionId(null);
    setError(null);
    setStepHistory([]);
    setValidationErrors({});
  }, []);

  const isFieldEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    // Add other checks if needed, e.g., for empty file objects
    return false;
  };

  const navigateToStep = useCallback((newStepId: string) => {
    setCurrentStepId(newStepId);
    setStepHistory(prev => [...prev, newStepId]);
    setValidationErrors({}); // <-- CLEAR errors on successful navigation
  }, []);
  
  const goBack = () => {
    if (stepHistory.length <= 1) return;
    const newHistory = stepHistory.slice(0, -1);
    setCurrentStepId(newHistory[newHistory.length - 1]);
    setStepHistory(newHistory);
  };

  const loadTool = useCallback(async (toolId: string) => {
    setIsLoading(true);
    resetTool();
    try {
      // Phase 1: Just get the definition for previewing. No run is created.
      const definition = await apiClient.getToolDefinition(toolId);
      setToolDefinition(definition);
      const firstStepId = definition.steps[0].stepId;
      setCurrentStepId(firstStepId);
      setStepHistory([firstStepId]);
    } catch (err) {
      console.error(err);
      setError('Failed to load tool definition for preview.');
    } finally {
      setIsLoading(false);
    }
  }, [resetTool]);

  const updateFormField = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };
  
  const mergeFormData = (data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const currentStep = toolDefinition?.steps.find(s => s.stepId === currentStepId) || null;

  const executeAction = async (action: Action) => {
    const errors: Record<string, string> = {};
    if (currentStep && currentStep.type === 'form' && currentStep.fields) {
      
      const visibleFields = currentStep.fields.filter(field =>
        checkDisplayCondition(field.displayCondition, formData)
      );

      for (const field of visibleFields) {
        if (field.required) {
          const value = formData[field.id];
          if (isFieldEmpty(value)) {
            errors[field.id] = `${field.label} is required.`;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      console.log("Validation failed on visible fields:", errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);
    setError(null);

    try {
      let activeRunId = runId;

      if (!activeRunId) {
        if (!toolDefinition) throw new Error("Cannot start run without a tool definition.");
        
        const { runId: newRunId } = await apiClient.startRun(toolDefinition.id, toolDefinition, formData);
        
        setRunId(newRunId);
        activeRunId = newRunId;
      }
      
      if (!activeRunId) throw new Error("Failed to create or retrieve a runId.");

      switch (action.type) {
        case 'worker': {
          const stepId = currentStep?.stepId;
          if (!stepId) {
            throw new Error("Cannot execute worker without a current step ID.");
          }
          await apiClient.post(`/runs/${activeRunId}/actions`, { 
            actionId: action.actionId, 
            formData: { ...formData, currentStepId: stepId }, 
            runData: jobResults 
          });
          setPollingAction(action);
          setPollingActionId(action.actionId);
          break;
        }
        case 'navigation': {
          await apiClient.put(`/runs/${activeRunId}/state`, {
            currentStepId: action.onSuccess.goToStep,
            formData
          });
          navigateToStep(action.onSuccess.goToStep);
          setIsLoading(false);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      setError('An API error occurred.');
      setIsLoading(false);
    }
  };

  useInterval(async () => {
    if (!pollingActionId || !runId) return;

    try {
      const run = await apiClient.getRun(runId);

      const jobStatus = run.jobHistory?.[pollingActionId]

      if (jobStatus?.status === 'COMPLETED') {
        console.log(`Job ${pollingActionId} completed successfully. Stopping poll.`);
        setPollingActionId(null);
        setPollingAction(null);
        setFormData(run.formData);
        setJobResults(run.runData);
        navigateToStep(run.currentStepId);
        setIsLoading(false);

      } else if (jobStatus?.status === 'FAILED') {
        let errorStepId = "error-step"
        if (pollingAction && pollingAction.type === 'worker') {
          errorStepId = pollingAction.onError?.goToStep || 'generic-error-step';
        }
        console.error("Job failed with details:", jobStatus.error);
        setPollingActionId(null);
        setPollingAction(null)
        setError(jobStatus.error || "An unknown job error occurred.");
        setIsLoading(false);
        navigateToStep(errorStepId);
      }

    } catch (err) {
      console.error("Polling failed:", err);
      setError("Failed to get run status.");
      setPollingActionId(null);
      setPollingAction(null);
      setIsLoading(false);
    }
  }, pollingActionId ? 4000 : null);
  
  const value = {
    runId,
    toolDefinition,
    currentStep,
    formData,
    jobResults,
    isLoading,
    error,
    stepHistory,
    validationErrors,
    loadTool,
    updateFormField,
    mergeFormData,
    executeAction,
    goBack,
    resetTool,
  };

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
};

export const useTool = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider');
  }
  return context;
};