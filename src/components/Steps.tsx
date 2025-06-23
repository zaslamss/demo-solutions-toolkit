import { useState } from "react";

import { Step as StepType, StepMessage } from "../types";
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

  const handleNextStep = async (stepId: string) => {
    const step = steps[currentStepIndex];

    if (step.id !== stepId) {
      return;
    }

    clearMessageForStep(stepId);

    const willCallApi = step.onSubmit?.action === "callApi" || step.onSubmit?.action === "getSheetInfo";

    if (willCallApi) {
      setIsLoadingForStep(stepId, true);
    }

    try {
      if (step.onSubmit?.action === "callApi") {
        const { apiEndpoint, method, inputMapping, storeResponseAs } = step.onSubmit;

        const body: Record<string, any> = {};
        for (const [apiKey, formPath] of Object.entries(inputMapping || {})) {
          const [sId, fieldId] = formPath.includes('.') ? formPath.split('.') : [step.id, formPath];
          body[apiKey] = formData[sId]?.[fieldId];
        }

        if (!apiEndpoint) {
          console.error("API endpoint is not defined");
          setMessageForStep(stepId, "ERROR", "API endpoint is not defined.");
          return;
        }

        let data: Record<string, any> = {};
        const fetchOptions: RequestInit = {
          method: method || 'POST',
          credentials: 'include',
        };

        if (step.type === "prompt") {
          data.promptContext = step.onSubmit.promptContext || "",
            data.data = body;
        } else {
          data = body;
        }

        if (['POST', 'PUT'].includes((method || 'POST').toUpperCase())) {
          fetchOptions.body = JSON.stringify(data);
        }

        const res = await fetch(apiEndpoint, fetchOptions);

        if (!res.ok) {
          const error = await res.json()
          setMessageForStep(stepId, "ERROR", error.message);
          return;
        }
        const result = await res.json();

        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result.data ? result.data : result
          }));
          const nextStep = steps[currentStepIndex + 1];
          if (nextStep?.type === "grid" && nextStep.dataSource === storeResponseAs) {
            setFormData(prev => ({
              ...prev,
              [nextStep.id]: { rows: result.rows }
            }));
          }
          if (step.type === "grid" && !storeResponseAs) {
            setFormData(prev => ({
              ...prev,
              [nextStep.id]: { rows: result.rows }
            }));
          }
          if (result.message) {
            setMessageForStep(stepId, "INFO", result.message);
          }
        }
      }

      if (step.onSubmit?.action === "getSheetInfo") {
        const { storeResponseAs } = step.onSubmit;
        const sheetId = formData[step.id]?.sheetId;
        if (!sheetId) {
          setMessageForStep(stepId, "ERROR", "Sheet ID is not defined.");
          throw new Error("Sheet ID is not defined");
        }
        const res = await fetch(`https://devapi.mbfcorp.tools/sheet/${sheetId}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) {
          setMessageForStep(stepId, "ERROR", await res.json());
          throw new Error("API call failed");
        }
        const result = await res.json();
        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result
          }));
        }
        if (result.message) {
          setMessageForStep(stepId, "INFO", result.message);
        }
      }

      // Check if this is the last step
      if (currentStepIndex === steps.length - 1) {
        setShowCompletionModal(true); // Show modal on "Submit" of the last step
      } else {
        setCurrentStepIndex(currentStepIndex + 1); // Move to next step
      }

    } catch (error) {
      console.error("API call failed:", error);
    } finally {
      if (willCallApi) {
        setIsLoadingForStep(stepId, false);
      }
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