// React + Third Party Libraries
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Accordion, Button, Container, Spinner } from "react-bootstrap";

// Components
import { DynamicFormModal } from "../components/DynamicFormModal";
import { Description } from "../components/Description";
import Runs from "../components/Runs";
import { InteractiveSteps } from "../components/InteractiveSteps";

// Types
import { ToolProps, Run, Step } from "../types";


const runs: Run[] = [
  {
    "id": "1",
    "name": "Demo Customizer Run 1",
    "progressTotal": 600,
    "progressCompleted": 10,
    "status": "IN PROGRESS",
    "log": [
      {
        "level": "INFO",
        "message": "We are starting the run"
      },
      {
        "level": "INFO",
        "message": "We are doing something"
      },
      {
        "level": "ERROR",
        "message": "Something went wrong"
      }
    ]
  },
  {
    "id": "2",
    "name": "Demo Customizer Run 2",
    "progressTotal": 600,
    "progressCompleted": 600,
    "status": "SUCCESS",
    "log": [
      {
        "level": "INFO",
        "message": "We are starting the run"
      },
      {
        "level": "INFO",
        "message": "We are doing something"
      },
      {
        "level": "ERROR",
        "message": "Something went wrong"
      }
    ]
  }
]

const steps: Record<string, Step[]> = {
  "Create a Tool": [
    {
      "id": "getToolInfo",
      "title": "Tool Overview",
      "description": "Enter the name of your tool along with a clear, user-friendly description that explains its purpose.",
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
          "id": "toolSummary",
          "type": "textarea",
          "label": "Summary",
          "required": true
        }
      ]
    },
    {
      "id": "getPrompt",
      "title": "Describe Your Tool",
      "description": "Provide details about the tool you want to create. Be as specific as possible when describing each step—include the step's title, a clear description, and an explanation of its purpose.",
      "type": "prompt",
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
    }
  ],
  "GridSnap": [
    {
      "id": "getSheetId",
      "title": "Sheet Information",
      "description": "Please enter the ID of the sheet you'd like to update and select whether you'd like to add new rows or delete & replace rows with new data.",
      "type": "form",
      "nextStepId": "getImage",
      "fields": [
        {
          "id": "sheetId",
          "type": "input",
          "label": "Sheet ID",
          "required": true
        },

      ]
    },
    {
      "id": "getImage",
      "title": "Upload Screenshot",
      "description": "Please upload the screenshot you'd like to reference to create your sheet.",
      "type": "form",
      "nextStepId": "confirmGrid",
      "fields": [
        {
          "id": "image",
          "type": "upload",
          "label": "",
          "required": true
        }
      ],
      "onSubmit": {
        "action": "callApi",
        "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/gemini-columns",
        "promptContext": "Please provide a list of steps that would be useful for a {prompt} use case.",
        "method": "POST",
        "inputMapping": {
          "prompt": "prompt",
        },
        "storeResponseAs": "columns"
      }
    },
    {
      "id": "confirmColumns",
      "title": "Confirm Columns",
      "description": "Review the generated columns below. You can edit the names and types of the columns. If your sheet currently has columns defined, this will be deleted. Click 'Next' to proceed.",
      "type": "editableGrid",
      "dataSource": "columns",
      "nextStepId": "confirmGrid",
      "onSubmit": {
        "action": "callApi",
        "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/gemini-grid-data",
        "promptContext": "Please provide a list of steps that would be useful for a {prompt} use case.",
        "method": "POST",
        "inputMapping": {
          "prompt": "prompt",
        },
        "storeResponseAs": "gridData"
      }
    },
    {
      "id": "confirmGrid",
      "title": "Confirm and Create Sheet",
      "type": "editableGrid",
      "dataSource": "gridData",
      "description": "Review the generated rows below. Click 'Submit' to proceed.",
      "onSubmit": {
        "action": "callApi",
        "apiEndpoint": "https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/actions/create-sheet",
        "method": "POST",
        "inputMapping": {
          "sheetId": "getSheetId.sheetId",
          "rows": "confirmGrid"
        }
      }
    }
  ]
}



export const Tool = () => {
  const [tool, setTool] = useState<ToolProps>();
  const [showFormModal, setShowFormModal] = useState(false);
  const { slug } = useParams()

  useEffect(() => {
    if (slug) {
      const fetchData = async () => {
        try {
          const response = await fetch(`https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/tools/${slug}`, {
            credentials: 'include',
          });
          const toolData = await response.json();
          setTool(toolData);
        } catch (error) {
          console.log("Error fetching tool data for ", slug, ": ", error)
        };
      }
      fetchData();
    }
  }, []);

  const handleCloseFormModal = () => setShowFormModal(false);
  const handleShowFormModal = () => setShowFormModal(true);
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fetchData = async () => {
      try {
        setShowFormModal(false);
        const response = await fetch('https://1ore5rpw95.execute-api.us-west-1.amazonaws.com/api/tools/demo-customizer', {
          method: "POST",
          body: JSON.stringify({
            function: `toolkit-${slug}`,
            workspace_ids: '6420289752983428,6173999148361604',
            key_1: 'Parent 1',
            value_1: '..USM..',
            key_2: 'Parent 2',
            value_2: '..EKG..'
          }),
          credentials: 'include',
        });
        const toolData = await response.json();
        console.log("toolData: ", toolData);
      } catch (error) {
        console.log("Error: ", error)
      };
    }
    fetchData();
  };

  return (
    <Container>
      {tool ? (
        <>
          {tool.name === "Demo Customizer" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0 fw-bold">{tool.name}</h4>
                <Button variant="primary" onClick={handleShowFormModal}>Use this Tool</Button>
              </div>
              <p>{tool.summary}</p>
              <DynamicFormModal formConfig={tool.form} toolName={tool.name} show={showFormModal} onClose={handleCloseFormModal} onSubmit={handleFormSubmit} />
              <Accordion defaultActiveKey={["0", "1"]} alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header><b>Description</b></Accordion.Header>
                  <Accordion.Body>
                    <Description description={tool.description} />
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header><b>Runs</b></Accordion.Header>
                  <Accordion.Body>
                    <Runs runs={runs} />
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>
          )}
          <h4 className="mb-3 fw-bold text-primary">{tool.name}</h4>
          <p>{tool.summary}</p>
          <InteractiveSteps steps={steps[tool.name]} />
        </>

      ) : <Spinner animation="border" variant="primary" />}
    </Container>
  )
}
