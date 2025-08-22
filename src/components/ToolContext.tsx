import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ToolDefinition, WizardStep, Action } from '../types';
import { apiClient } from './ApiClient';
import { useInterval } from './UseInterval';
import { checkDisplayCondition } from './utils/conditions';

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
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const resetTool = useCallback(() => {
    setRunId(null);
    setToolDefinition(null);
    setCurrentStepId(null);
    setFormData({});
    setJobResults({});
    setActiveJobId(null);
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

  const executeAction = async (action: Action) => {
    const errors: Record<string, string> = {};
    if (currentStep && currentStep.type === 'form' && currentStep.fields) {
      
      // 1. First, determine which fields are actually visible to the user.
      const visibleFields = currentStep.fields.filter(field =>
        checkDisplayCondition(field.displayCondition, formData)
      );

      // 2. Now, loop over ONLY the visible fields to check for required values.
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
      return; // Stop execution
    }

    // If validation passes, clear any previous errors
    setValidationErrors({});
    
    // --- 2. EXISTING ACTION LOGIC ---
    setIsLoading(true);
    setError(null);

    try {
      let activeRunId = runId;

      // --- "Lazy Create" Logic: Create the run on the first action ---
      if (!activeRunId) {
        if (!toolDefinition) throw new Error("Cannot start run without a tool definition.");
        
        const { runId: newRunId } = await apiClient.startRun(toolDefinition.id, toolDefinition, formData);
        
        setRunId(newRunId);
        activeRunId = newRunId;
      }
      
      if (!activeRunId) throw new Error("Failed to create or retrieve a runId.");

      // --- Proceed with the action using the guaranteed activeRunId ---
      switch (action.type) {
        case 'worker': {
          const response = await apiClient.post(`/runs/${activeRunId}/actions`, { 
            actionId: action.actionId, formData, runData: jobResults 
          });
          setActiveJobId(response.jobId);
          // isLoading stays true until the poller finishes
          break;
        }
        case 'navigation': {
          await apiClient.put(`/runs/${activeRunId}/state`, {
            currentStepId: action.onSuccess.goToStep,
            formData
          });
          navigateToStep(action.onSuccess.goToStep);
          setIsLoading(false); // Action is complete
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
    if (!activeJobId || !runId) return;

    try {
      const status = await apiClient.getJobStatus(runId, activeJobId);

      // Find the action that started this job
      const currentAction = (currentStep as any)?.actions.find(
        (a: Action) => a.type === 'worker' && a.actionId === (currentStep as any)?.lastActionId // We might need to store lastActionId
      ) || (currentStep as any)?.actions.find((a: Action) => a.type === 'worker'); // Fallback

      // --- THIS IS THE UPDATED LOGIC ---
      if (status.status === 'COMPLETED' && status.result) {
        // --- SUCCESS PATH (no changes here) ---
        const { nextStepId, data } = status.result;
        if (currentAction && data) {
          setJobResults(prev => ({ ...prev, [currentAction.backend.outputKey]: data }));
        }
        navigateToStep(nextStepId);
        setActiveJobId(null);
        setIsLoading(false);

      } else if (status.status === 'FAILED') {
        // --- FAILURE PATH ---
        console.error("Job failed with details:", status.errorDetails);
        
        // 1. Stop polling and loading
        setActiveJobId(null);
        setIsLoading(false);
        
        // 2. Set the global error message
        const errorMessage = status.errorDetails?.message || 'An unknown error occurred on the backend.';
        setError(errorMessage);

        // 3. Find the correct error step from the JSON definition
        const errorStepId = currentAction?.onError?.goToStep || 'generic-error-step'; // Use a fallback
        navigateToStep(errorStepId);
      }
      // If status is 'PENDING', we do nothing and the interval continues.

    } catch (err) {
      console.error("Polling failed:", err);
      setError("Failed to get job status.");
      setActiveJobId(null);
      setIsLoading(false);
    }
  }, activeJobId ? 4000 : null);

  const currentStep = toolDefinition?.steps.find(s => s.stepId === currentStepId) || null;
  
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