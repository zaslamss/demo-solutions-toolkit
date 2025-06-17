import { useState } from "react";

import { Step as StepType } from "../types";
import { Step } from "./Step";
import { Modal, Button } from "react-bootstrap";

interface StepsProps {
  steps: StepType[];
}

export const Steps = ({ steps }: StepsProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [responseData, setResponseData] = useState<Record<string, any>>({});
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

  const handleNextStep = async (stepId: string) => {
    const step = steps[currentStepIndex];

    if (step.id !== stepId) {
      return;
    }

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

        if (!res.ok) throw new Error(`API call failed with status ${res.status}`);
        const result = await res.json();

        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result
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
        }
      }

      if (step.onSubmit?.action === "getSheetInfo") {
        const { storeResponseAs } = step.onSubmit;
        const sheetId = formData[step.id]?.sheetId;
        if (!sheetId) {
          console.error("Sheet ID is not defined");
          return;
        }
        const res = await fetch(`https://devapi.mbfcorp.tools/sheet/${sheetId}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`API call failed with status ${res.status}`);
        const result = await res.json();
        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result
          }));
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

  const handleInputChange = (stepId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [stepId]: {
        ...(prev[stepId] || {}),
        [fieldId]: value
      }
    }));
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCurrentStepIndex(0);
    setFormData({});
    setResponseData({});
  };

  return (
    <>
      <div>
        {steps.slice(0, currentStepIndex + 1).map((step, index) => {
          const isCurrentStep = index === currentStepIndex;
          const isLoadingThisStep = loadingStepIds.has(step.id);
          const isLastStep = index === steps.length - 1; 

          return (
            <Step
              key={step.id}
              step={step}
              isCurrentStep={isCurrentStep}
              isLastStep={isLastStep}
              formData={formData}
              setFormData={setFormData}
              onInputChange={handleInputChange}
              onNextStep={handleNextStep}
              isLoadingThisStep={isLoadingThisStep}
              responseData={responseData}
            />
          );
        })}
      </div>
      {/* Completion Modal */}
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