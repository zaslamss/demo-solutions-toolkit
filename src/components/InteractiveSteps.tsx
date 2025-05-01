// Bootstrap Imports
import { useState } from "react";
import { Button, Card, Form, InputGroup } from "react-bootstrap";

const steps = [
  {
    "id": "get_sheet_id",
    "title": "Sheet Information",
    "action": "gather_input",
    "description": "Please enter the ID of the sheet you'd like to update and select whether you'd like to add new rows or delete & replace rows with new data.",
    "nextStepId": "get_prompt",
    "fields": [
      {
        "id": "sheet_id",
        "type": "input",
        "label": "Sheet ID",
        "required": true
      },
      {
        "id": "update_type",
        "type": "select",
        "options": [
          { "value": "add_rows", "label": "Add rows to the bottom of the sheet" },
          { "value": "update_rows", "label": "Delete all the rows and replace with new rows" },
        ],
        "required": true
      }
    ]
  },
  {
    "id": "get_prompt",
    "title": "Enter Your Use Case",
    "action": "gather_input",
    "description": "Please enter the prompt you would like to send to Google Gemini.",
    "nextStepId": "confirm_data",
    "fields": [
      {
        "id": "prompt",
        "type": "textarea",
        "label": "Prompt",
        "required": true
      }
    ]
  },
  {
    "id": "confirm_data",
    "title": "Confirm Your Data",
    "action": "confirm_input",
    "description": "Please confirm the data you have entered.",
    "fields": []
  },
]

export const InteractiveSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle form submission or final action
      console.log("Final step reached");
    }
  }

  return (
    <div>
      {
        steps.slice(0, currentStep + 1).map((step, index) => (
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
                        <Form.Control />
                      </InputGroup>
                    )}
                    {field.type === "textarea" && (
                      <InputGroup>
                        <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                        <Form.Control as="textarea" />
                      </InputGroup>
                    )}
                    {field.type === "select" && (
                      <>
                        <Form.Label id={field.id}>{field.label}</Form.Label>
                        <Form.Select>
                          {field?.options?.map((option: any) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      </>
                    )}
                  </div>
                ))
              }
              {step.nextStepId ? (
                <Button variant="primary" type="button" className="float-end" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" type="button" className="float-end" onClick={() => console.log("Submit")}>
                  Submit
                </Button>)}
            </Card.Body>
          </Card>
        ))
      }
    </div>
  )
}