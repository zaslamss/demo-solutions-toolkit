import { useState } from "react";
import { Button, Card, Form, InputGroup } from "react-bootstrap";
import { Step } from "../types";
import { Grid } from "./Grid";

interface InteractiveStepsProps {
  steps: Step[];
}

export const InteractiveSteps = ({ steps }: InteractiveStepsProps) => {
  // Initialize state for current step index, form data, and response data
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [responseData, setResponseData] = useState<Record<string, any>>({});

  // Function to handle the next step logic
  const handleNextStep = async () => {
    const step = steps[currentStepIndex];

    if (step.onSubmit?.action === "callApi") {
      const { apiEndpoint, method, inputMapping, storeResponseAs } = step.onSubmit;

      // Build request body from inputMapping
      const body: Record<string, any> = {};
      for (const [apiKey, formPath] of Object.entries(inputMapping || {})) {
        const [stepId, fieldId] = formPath.includes('.') ? formPath.split('.') : [step.id, formPath];
        body[apiKey] = formData[stepId]?.[fieldId];
      }
      console.log("Request body for API call:", body);

      // Make API call
      if (!apiEndpoint) {
        console.error("API endpoint is not defined");
        return;
      }

      let data: Record<string, any> = {};

      try {
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

        // Store the result using the alias from config
        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result
          }));
          // Prepopulate formData here if the next step is a grid
          const nextStep = steps[currentStepIndex + 1];
          if (nextStep?.type === "grid" && nextStep.dataSource === storeResponseAs) {
            setFormData(prev => ({
              ...prev,
              [nextStep.id]: { rows: result.rows }
            }));
          }
          if (step.type === "grid") {
            setFormData(prev => ({
              ...prev,
              [nextStep.id]: { rows: result.rows }
            }));
          }
        }
      } catch (error) {
        console.error("API call failed:", error);
        return; // Optionally prevent advancing to next step
      }
    }

    if (step.onSubmit?.action === "getSheetInfo") {
      const { storeResponseAs } = step.onSubmit;
      const sheetId = formData[step.id]?.sheetId;
      if (!sheetId) {
        console.error("Sheet ID is not defined");
        return;
      }
      try {
        const res = await fetch(`https://devapi.mbfcorp.tools/sheet/${sheetId}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`API call failed with status ${res.status}`);
        const result = await res.json();
        // Store the result using the alias from config
        if (storeResponseAs) {
          setResponseData(prev => ({
            ...prev,
            [storeResponseAs]: result
          }));
        }} catch (error) {
        console.error("API call failed:", error);
      }
    }

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Function to handle input changes in the form
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
            <Card style={{ width: '100%' }} className="h-100 mb-3" key={step.id}>
              <Card.Body>
                <Card.Title><b>{step.title}</b></Card.Title>
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
                {step.type === "grid" && step.dataSource && responseData[step.dataSource] && (
                  <Grid
                    gridData={responseData[step.dataSource]}
                    editable={step.editable}
                    stepId={step.id}
                    formData={formData}
                    setFormData={setFormData}
                    disabled={!isCurrentStep}
                    />
                )}
                <div className="d-grid gap-2">
                {step.nextStepId ? (
                  <Button variant="primary" type="button" className="float-end" onClick={handleNextStep} disabled={!isCurrentStep}>
                    Next
                  </Button>
                ) : (
                  <Button variant="primary" type="button" className="float-end" disabled={!isCurrentStep} onClick={() => console.log("Submit data", formData)}>
                    Submit
                  </Button>)}
                </div>
              </Card.Body>
            </Card>
          )
        })
      }
    </div>
  )
}