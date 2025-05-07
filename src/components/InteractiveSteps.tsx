// Bootstrap Imports
import { useState } from "react";
import { Button, Card, Form, InputGroup } from "react-bootstrap";
import { EditableGrid } from "./EditableGrid";

// const steps = [
//   {
//     "id": "getSheetId",
//     "title": "Sheet Information",
//     "description": "Please enter the ID of the sheet you'd like to update and select whether you'd like to add new rows or delete & replace rows with new data.",
//     "type": "form",
//     "nextStepId": "getUseCasePrompt",
//     "fields": [
//       {
//         "id": "sheetId",
//         "type": "input",
//         "label": "Sheet ID",
//         "required": true
//       }
//     ]
//   },
//   {
//     "id": "getUseCasePrompt",
//     "title": "Enter Your Use Case",
//     "description": "Please enter the prompt you would like to send to Google Gemini to create your columns.",
//     "type": "apiPrompt",
//     "nextStepId": "confirmColumns",
//     "fields": [
//       {
//         "id": "prompt",
//         "type": "textarea",
//         "label": "Prompt",
//         "required": true
//       }
//     ],
//     // TODO: Figure out how to add additional context to the gemini prompt
//     "onSubmit": {
//       "action": "callApi",
//       "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/gemini-use-case",
//       "promptContext": "Please provide a list of columns that would be useful for a {prompt} use case.",
//       "method": "POST",
//       "inputMapping": {
//         "prompt": "prompt",
//       },
//       "storeResponseAs": "geminiColumns"
//     }
//   },
//   {
//     "id": "confirmColumns",
//     "title": "Confirm Columns",
//     "description": "Review the generated columns below. You can edit the names and types of the columns. If your sheet currently has columns defined, this will be deleted. Click 'Next' to proceed.",
//     "type": "editableGrid",
//     "dataSource": "geminiColumns",
//     "nextStepId": "getMockDataPrompt",
//   },
//   {
//     "id": "getMockDataPrompt",
//     "title": "Enter a prompt for mock data",
//     "description": "Please enter the prompt you would like to send to Google Gemini to create your mock data.",
//     "type": "apiPrompt",
//     "nextStepId": "confirmGrid",
//     "fields": [
//       {
//         "id": "mockDataPrompt",
//         "type": "textarea",
//         "label": "Prompt",
//         "required": true
//       }
//     ],
//     "onSubmit": {
//       "action": "callApi",
//       "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/gemini-use-case",
//       "promptContext": "Please provide a list of rows that would be useful for a {mockDataPrompt} use case.",
//       "method": "POST",
//       "inputMapping": {
//         "prompt": "mockDataPrompt",
//         "columns": "createdColumns"
//       },
//       "storeResponseAs": "mockData"
//     }
//   },
//   {
//     "id": "confirmGrid",
//     "title": "Confirm and Create Sheet",
//     "type": "viewableGrid",
//     "dataSource": "mockData",
//     "description": "Review the generated rows below. Click 'Submit' to proceed.",
//     "onSubmit": {
//       "action": "callApi",
//       "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/actions/create-sheet",
//       "method": "POST",
//       "inputMapping": {
//         "sheetId": "getSheetId.sheetId",
//         "rows": "confirmGrid"
//       }
//     }
//   }
// ]

const steps = [
  {
    "id": "getToolInfo",
    "title": "Tool Basics",
    "description": "Enter the basic information about your tool. This will be used to create the tool.",
    "type": "form",
    "nextStepId": "getPrompt",
    "fields": [
      {
        "id": "toolName",
        "type": "input",
        "label": "Name",
        "required": true
      },
      {
        "id": "toolSlug",
        "type": "input",
        "label": "Slug",
        "required": true
      },
      {
        "id": "toolSummary",
        "type": "textarea",
        "label": "Summary",
        "required": true
      }
    ]
  },
  {
    "id": "getPrompt",
    "title": "Enter Your Tool Idea",
    "description": "Enter information about the tool you'd like to create. Make sure to define each step as detailed as you can. Include information about the 'title', 'description', and what this step is doing.",
    "type": "prompt",
    "nextStepId": "confirmPrompt",
    "fields": [
      {
        "id": "prompt",
        "type": "textarea",
        "label": "Prompt",
        "required": true
      }
    ],
    "onSubmit": {
      "action": "callApi",
      "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/gemini-use-case",
      "promptContext": "Please provide a list of steps that would be useful for a {prompt} use case.",
      "method": "POST",
      "inputMapping": {
        "prompt": "prompt",
      },
      "storeResponseAs": "toolSteps"
    }
  },
  {
    "id": "confirmPrompt",
    "title": "Confirm Steps",
    "description": "Review the generated steps below. You can edit the names and types of the steps. Click 'Next' to proceed.",
    "type": "editableGrid",
    "dataSource": "toolSteps",
    "nextStepId": "getMockDataPrompt",
  },
  {
    "id": "uploadFiles",
    "title": "Upload your Backend Zip File",
    "description": "Upload the zip file containing your backend code. This will be used to create the tool.",
    "type": "form",
    "fields": [
      {
        "id": "backendZip",
        "type": "upload",
        "label": "",
        "required": true
      }
    ],
    "nextStepId": "confirmCreateTool",
  },
  {
    "id": "confirmCreateTool",
    "title": "Create Tool",
    "description": "Click 'Submit' to create your tool.",
  }

]

export const InteractiveSteps = () => {
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
      for (const [apiKey, formPath] of Object.entries(inputMapping)) {
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