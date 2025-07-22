import { useState } from "react";

import { Step as StepType, OnSubmitAction, StepMessage } from "../types";
import { Step } from "./Step";
import { Modal, Button } from "react-bootstrap";

interface StepsProps {
  steps: StepType[];
}

export const Steps = ({ steps }: StepsProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [responseData, setResponseData] = useState<Record<string, any>>({});
  const [messageData, setMessageData] = useState<Record<string, StepMessage>>({});
  const [loadingStepIds, setLoadingStepIds] = useState<Set<string>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const modalText = "The tool ran successfully. Thank you!";

  const setIsLoadingForStep = (stepId: string, isLoading: boolean) => {
    setLoadingStepIds(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(stepId);
      } else {
        newSet.delete(stepId);
      }
      return newSet;
    });
  };

  const setMessageForStep = (stepId: string, level: StepMessage['level'], message: string) => {
    setMessageData(prev => ({
      ...prev,
      [stepId]: { level, message }
    }));
  };

  const clearMessageForStep = (stepId: string) => {
    setMessageData(prev => {
      const newMessages = { ...prev };
      delete newMessages[stepId];
      return newMessages;
    });
  };

const resolveValue = (path: string, currentStepId: string): any => {
    const parts = path.split('.');

    if (parts.length === 1) {
        return formData[currentStepId]?.[parts[0]];
    } else if (parts.length === 2) {
        const [sourceId, fieldId] = parts;
        if (formData[sourceId] !== undefined) {
            return formData[sourceId][fieldId];
        }
        if (responseData[sourceId] !== undefined) {
            if (typeof responseData[sourceId] === 'object' && responseData[sourceId] !== null) {
                return responseData[sourceId][fieldId];
            }
            return undefined;
        }
    }
    return undefined;
};

  const handleNextStep = async (stepId: string) => {
    const step = steps[currentStepIndex];

    if (step.id !== stepId) {
      return;
    }

    clearMessageForStep(stepId);

    setIsLoadingForStep(stepId, true);

    let hasError = false;

    try {
      const onSubmitActions: OnSubmitAction[] = Array.isArray(step.onSubmit)
        ? step.onSubmit
        : (step.onSubmit ? [step.onSubmit as OnSubmitAction] : []);
      
      for (const actionConfig of onSubmitActions) {
        let shouldExecuteAction = true;

        if (actionConfig.condition) {
          const { when, equals } = actionConfig.condition;
          const actualValue = resolveValue(when, step.id);
          if (String(actualValue) !== String(equals)) {
            shouldExecuteAction = false;
          }
        }

        if (!shouldExecuteAction) {
          continue; 
        }

        // 2. Execute Action based on type
        if (actionConfig.action === "callApi" || actionConfig.action === "getSheetInfo") {
          // Centralized API call logic
          const { apiEndpoint, method, inputMapping, promptContext, storeResponseAs, prompt } = actionConfig;

          const body: Record<string, any> = {};
          for (const [apiKey, formPath] of Object.entries(inputMapping || {})) {
              // The path can now be from current step's formData or previously stored responseData
              const value = resolveValue(formPath as string, step.id);
              body[apiKey] = value;
          }

          if (!apiEndpoint) {
            console.error(`Step ${stepId}: API endpoint is not defined for action:`, actionConfig);
            setMessageForStep(stepId, "ERROR", `API endpoint is not defined for an action.`);
            hasError = true;
            break;
          }

          let dataToSend: Record<string, any> = {};

          if ((step.type === "prompt" || prompt) && promptContext) {
            dataToSend.promptContext = promptContext;
            dataToSend.data = body;
          } else {
            dataToSend = body;
          }

          let finalApiEndpoint = apiEndpoint;
          if (actionConfig.action === "getSheetInfo" && method === "GET") {
              const sheetId = formData[step.id]?.sheetId;
              if (!sheetId) {
                  setMessageForStep(stepId, "ERROR", "Sheet ID is required for getSheetInfo.");
                  hasError = true;
                  break;
              }
              finalApiEndpoint = `${apiEndpoint}/${sheetId}`; 
          }


          const fetchOptions: RequestInit = {
            method: method || 'POST',
            credentials: 'include',
          };

          if (['POST', 'PUT'].includes((method || 'POST').toUpperCase())) {
            fetchOptions.body = JSON.stringify(dataToSend);
          }

          try {
            const res = await fetch(finalApiEndpoint, fetchOptions);

            if (!res.ok) {
              const error = await res.json();
              setMessageForStep(stepId, "ERROR", `API Error for action (${actionConfig.action}): ${error.message || JSON.stringify(error)}`);
              hasError = true;
              break;
            }
            const result = await res.json();

            if (storeResponseAs) {
              setResponseData(prev => ({
                ...prev,
                [storeResponseAs]: result.data ? result.data : result
              }));

              const nextStep = steps[currentStepIndex + 1];
              if (nextStep && nextStep.type === "grid" && nextStep.dataSource === storeResponseAs) {
                setFormData(prev => ({
                  ...prev,
                  [nextStep.id]: { rows: result.rows || result }
                }));
              }
            }
            if (result.message) {
              setMessageForStep(stepId, "INFO", result.message);
            }
          } catch (apiError) {
            console.error(`API call for action (${actionConfig.action}) failed:`, apiError);
            setMessageForStep(stepId, "ERROR", `API call failed for action (${actionConfig.action}).`);
            hasError = true;
            break;
          }

        } else if (actionConfig.action === "storeLocal") {
          const { storeDataAs, dataToStore } = actionConfig;

          if (storeDataAs) {
            let dataToStoreFinal = dataToStore;

            if (typeof dataToStore === 'object' && dataToStore !== null) {
                dataToStoreFinal = { ...dataToStore }; 
                if (actionConfig.inputMapping) {
                    for (const [key, path] of Object.entries(actionConfig.inputMapping)) {
                        dataToStoreFinal[key] = resolveValue(path, step.id);
                    }
                }
            } else if (typeof dataToStore === 'string' && dataToStore.startsWith('formData.')) {
                dataToStoreFinal = resolveValue(dataToStore.replace('formData.', step.id + '.'), step.id);
                if (dataToStoreFinal === undefined) {
                    console.warn(`Step ${stepId}: Could not resolve value for 'storeLocal' action from path: ${dataToStore}`);
                    setMessageForStep(stepId, "ERROR", `Data to store not found for '${storeDataAs}'.`);
                    hasError = true;
                    break;
                }
            }

            setResponseData(prev => ({
              ...prev,
              [storeDataAs]: dataToStoreFinal
            }));
            setMessageForStep(stepId, "INFO", `Using existing '${storeDataAs}' data.`);

            const nextStep = steps[currentStepIndex + 1];
            if (nextStep && nextStep.type === "grid" && nextStep.dataSource === storeDataAs) {
                setFormData(prev => ({
                  ...prev,
                  [nextStep.id]: dataToStoreFinal
                }));
            }

          } else {
            console.warn(`Step ${stepId}: 'storeDataAs' not defined for 'storeLocal' action:`, actionConfig);
            setMessageForStep(stepId, "ERROR", `'storeDataAs' not defined for 'storeLocal' action.`);
            hasError = true;
            break;
          }
        }
        if (hasError) {
            break;
        }
      }

      if (!hasError) {
        if (currentStepIndex === steps.length - 1) {
          setShowCompletionModal(true);
        } else {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      }

    } catch (error) {
      console.error("An unexpected error occurred during step processing:", error);
      setMessageForStep(stepId, "ERROR", `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
      hasError = true;
    } finally {
        setIsLoadingForStep(stepId, false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const currentStepId = steps[currentStepIndex].id;
      clearMessageForStep(currentStepId);
      
      const previousStepIndex = currentStepIndex - 1;
      const previousStepId = steps[previousStepIndex].id;
      clearMessageForStep(previousStepId)
      setCurrentStepIndex(previousStepIndex);
    }
  };

  const handleInputChange = (stepId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [stepId]: {
        ...(prev[stepId] || {}),
        [fieldId]: value
      }
    }));
    clearMessageForStep(stepId);
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCurrentStepIndex(0);
    setFormData({});
    setResponseData({});
    setMessageData({});
  };

  return (
    <>
      <div>
        {steps.slice(0, currentStepIndex + 1).map((step, index) => {
          const isCurrentStep = index === currentStepIndex;
          const isLoadingThisStep = loadingStepIds.has(step.id);
          const isLastStep = index === steps.length - 1; 
          const stepMessage = messageData[step.id];


          return (
            <Step
              key={step.id}
              step={step}
              isCurrentStep={isCurrentStep}
              currentStepIndex={currentStepIndex}
              isLastStep={isLastStep}
              formData={formData}
              setFormData={setFormData}
              onInputChange={handleInputChange}
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep} 
              isLoadingThisStep={isLoadingThisStep}
              responseData={responseData}
              message={stepMessage}
            />
          );
        })}
      </div>
      <Modal show={showCompletionModal} onHide={handleCloseCompletionModal}>
        <Modal.Header closeButton>
          <Modal.Title>Completed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{modalText}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCompletionModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};