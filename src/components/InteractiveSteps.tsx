// Bootstrap Imports
import { useState } from "react";
import { Button, Card, Form, InputGroup } from "react-bootstrap";
import { EditableGrid } from "./EditableGrid";
import { Step } from "../types";

interface InteractiveStepsProps {
  steps: Step[];
}

export const InteractiveSteps = ({ steps }: InteractiveStepsProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [responseData, setResponseData] = useState<Record<string, any>>({});

  const handleNextStep = async () => {
    const step = steps[currentStepIndex];

    // If the step is an API prompt, trigger API call
    if (step.onSubmit?.action === "callApi") {
      const { apiEndpoint, method, inputMapping, storeResponseAs } = step.onSubmit;

      // Build request body from inputMapping
      const body: Record<string, any> = {};
      for (const [apiKey, formPath] of Object.entries(inputMapping || {})) {
        const [stepId, fieldId] = formPath.includes('.') ? formPath.split('.') : [step.id, formPath];
        body[apiKey] = formData[stepId]?.[fieldId];
      }

      try {
        const res = await fetch(apiEndpoint, {
          method: method || 'POST',
          credentials: 'include',
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`API call failed with status ${res.status}`);
        const result = await res.json();

        // Store the result using the alias from config
        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result
          }));
          // Prepopulate formData here if the next step is an editableGrid
          const nextStep = steps[currentStepIndex + 1];
          if (nextStep?.type === "editableGrid" && nextStep.dataSource === storeResponseAs) {
            const initialRows = result.rows.map((row: any[]) =>
              row.reduce((acc: any, field: any) => {
                acc[field.id] = field.value || "";
                return acc;
              }, {})
            );

            setFormData(prev => ({
              ...prev,
              [nextStep.id]: { rows: initialRows }
            }));
          }
        }
      } catch (error) {
        console.error("API call failed:", error);
        return; // Optionally prevent advancing to next step
      }
    }

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
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

  return (
    <div>
      {
        steps.slice(0, currentStepIndex + 1).map((step, index) => {
          const isCurrentStep = index === currentStepIndex;
          return (
            <Card style={{ width: '65rem' }} className="h-100 mb-3" key={step.id}>
              <Card.Body>
                <Card.Title>{step.title}</Card.Title>
                <p>{step.description}</p>
                {
                  step?.fields?.map((field) => (

                    <div key={field.id} className="mb-3">
                      {field.type === "input" && (
                        <InputGroup>
                          <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                          <Form.Control
                            value={formData[step.id]?.[field.id] || ''}
                            onChange={(e) => handleInputChange(step.id, field.id, e.target.value)}
                            disabled={!isCurrentStep}
                          />
                        </InputGroup>
                      )}
                      {field.type === "textarea" && (
                        <InputGroup>
                          <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                          <Form.Control
                            as="textarea"
                            value={formData[step.id]?.[field.id] || ''}
                            onChange={(e) => handleInputChange(step.id, field.id, e.target.value)}
                            disabled={!isCurrentStep}
                          />
                        </InputGroup>
                      )}
                      {field.type === "upload" && (
                        <InputGroup>
                          <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                          <Form.Control
                            type="file"
                            onChange={(e) => handleInputChange(step.id, field.id, e.target.value)}
                            disabled={!isCurrentStep}
                          />
                        </InputGroup>
                      )}
                    </div>
                  ))
                }
                {step.type === "confirmGrid" && (
                  <div>
                    <h5>Confirmed Data:</h5>
                    <pre>{JSON.stringify(formData, null, 2)}</pre>
                    {responseData.geminiColumns && (
                      <div>
                        <h5>API Response:</h5>
                        <pre>{JSON.stringify(responseData.geminiColumns, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
                {step.type === "editableGrid" && step.dataSource && responseData[step.dataSource] && (
                  <EditableGrid
                    gridData={responseData[step.dataSource]}
                    stepId={step.id}
                    formData={formData}
                    setFormData={setFormData}
                    disabled={!isCurrentStep}
                  />
                )}
                {step.nextStepId ? (
                  <Button variant="primary" type="button" className="float-end" onClick={handleNextStep} disabled={!isCurrentStep}>
                    Next
                  </Button>
                ) : (
                  <Button variant="primary" type="button" className="float-end" disabled={!isCurrentStep} onClick={() => console.log("Submit data", formData)}>
                    Submit
                  </Button>)}
              </Card.Body>
            </Card>
          )
        })
      }
    </div>
  )
}