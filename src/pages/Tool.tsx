import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
// import { DynamicFormModal } from "../components/DynamicFormModal";
// import { Description } from "../components/Description";
// import Runs from "../components/Runs";
import { Steps } from "../components/Steps";
import { ToolProps, Step } from "../types";


// const runs: Run[] = [
//   {
//     "id": "1",
//     "name": "Demo Customizer Run 1",
//     "progressTotal": 600,
//     "progressCompleted": 10,
//     "status": "IN PROGRESS",
//     "log": [
//       {
//         "level": "INFO",
//         "message": "We are starting the run"
//       },
//       {
//         "level": "INFO",
//         "message": "We are doing something"
//       },
//       {
//         "level": "ERROR",
//         "message": "Something went wrong"
//       }
//     ]
//   },
//   {
//     "id": "2",
//     "name": "Demo Customizer Run 2",
//     "progressTotal": 600,
//     "progressCompleted": 600,
//     "status": "SUCCESS",
//     "log": [
//       {
//         "level": "INFO",
//         "message": "We are starting the run"
//       },
//       {
//         "level": "INFO",
//         "message": "We are doing something"
//       },
//       {
//         "level": "ERROR",
//         "message": "Something went wrong"
//       }
//     ]
//   }
// ]

const steps: Record<string, Step[]> = {
  "GridSnap": [
    {
      "id": "getSheetId",
      "title": "Sheet Information",
      "description": "Enter the ID of the sheet you'd like to update.",
      "type": "form",
      "nextStepId": "getImage",
      "fields": [
        {
          "id": "sheetId",
          "type": "input",
          "label": "Sheet ID",
          "required": true
        },
      ],
      "onSubmit": [{
        "action": "getSheetInfo",
        "apiEndpoint": "https://devapi.mbfcorp.tools/sheet",
        "method": "GET",
        "storeResponseAs": "sheetInfo"
      }]
    },
    {
      "id": "getImage",
      "title": "Upload Image",
      "description": "Upload the image you'd like to reference to create your sheet.",
      "type": "prompt",
      "nextStepId": "confirmGrid",
      "fields": [
        {
          "id": "image",
          "type": "upload",
          "label": "",
          "required": true
        }
      ],
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/gemini-prompt",
        "promptContext": "Provided this image, extract the column headers, and for each header, infer the most likely data type based on the visibile content in that column. Rules: 1. Ignore any application UI elements such as ribbon bars, toolbars, or menus (e.g. 'File', 'Edit', etc). 2. Focus on ONLY the actual column headers directly above the grid of structed data. 3. Preserve the exact text of the headers as seen in the image. 4. If no table is visible return an error.",
        "method": "POST",
        "inputMapping": {
          "image": "getImage.image",
        },
        "storeResponseAs": "columns"
      }]
    },
    {
      "id": "confirmColumns",
      "title": "Confirm Columns",
      "description": "Review the generated columns below. Proceeding to the next step will create these columns. This will delete any existing columns (and data) in the sheet.",
      "type": "grid",
      "dataSource": "columns",
      "nextStepId": "confirmGrid",
      "onSubmit":[{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/create-columns",
        "method": "POST",
        "inputMapping": {
          "sheet_id": "getSheetId.sheetId",
          "columns": "confirmColumns.rows"
        },
        "storeResponseAs": "columnsCreated"
      },
      {
        "action": "callApi",
        "prompt": true,
        "apiEndpoint": "https://devapi.mbfcorp.tools/gemini-prompt",
        "promptContext": "Retrieve the grid data from the image provided. Ignore the column header row. If the data type is a DATE, always return DATE in the format YYYY-MM-DD (ISO 8601). If the data type is a DATETIME, always return DATETIMEs in the format YYYY-MM-DDTHH:MM:SSZ (ISO 8601, UTC). If it's a CONTACT_LIST, return a valid email address. If you're not able to determine what the email address is return a placeholder in the format visible_name@example.com.",
        "method": "POST",
        "inputMapping": {
          "columns": "confirmColumns.rows",
          "image": "getImage.image"
        },
        "storeResponseAs": "gridData"
      }
      ]
    },
    {
      "id": "confirmGrid",
      "title": "Confirm and Create Sheet",
      "type": "grid",
      "dataSource": "gridData",
      "description": "Review the generated rows below. Submit to update your sheet.",
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/tools/gridsnap",
        "method": "POST",
        "inputMapping": {
          "sheet_id": "getSheetId.sheetId",
          "rows": "confirmGrid.rows"
        }
      }]
    }
  ],
  "SheetGenie": [
    {
      "id": "getSheetId",
      "title": "Sheet Information",
      "description": "Please enter the ID of the sheet you'd like to update.",
      "type": "form",
      "nextStepId": "getUseCase",
      "fields": [
        {
          "id": "sheetId",
          "type": "input",
          "label": "Sheet ID",
          "required": true
        },
      ],
      "onSubmit": [{
        "action": "getSheetInfo",
        "apiEndpoint": "https://devapi.mbfcorp.tools/sheet",
        "method": "GET",
        "storeResponseAs": "sheetInfo"
      }]
    },
    {
      "id": "getUseCase",
      "title": "Describe Your Use Case",
      "description": "Describe the use case for which you'd like to generate mock data for. This will be used to generate the column names and data types.",
      "type": "prompt",
      "nextStepId": "confirmColumns",
      "fields": [
        {
          "id": "prompt",
          "type": "textarea",
          "label": "Prompt",
          "required": true
        }
      ],
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/gemini-prompt",
        "promptContext": "I am creating a Smartsheet sheet for a {prompt} use case. Please provide a list of column headers that would be useful information for me to track on this sheet.",
        "method": "POST",
        "inputMapping": {
          "prompt": "prompt",
        },
        "storeResponseAs": "columns"
      }]
    },
    {
      "id": "confirmColumns",
      "title": "Confirm Columns",
      "description": "Review the generated columns below. You can edit the names and types of the columns. If your sheet currently has columns defined, this will be deleted. Click 'Next' to proceed.",
      "type": "grid",
      "editable": true,
      "dataSource": "columns",
      "nextStepId": "getDataPrompt",
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/create-columns",
        "method": "POST",
        "inputMapping": {
          "sheet_id": "getSheetId.sheetId",
          "columns": "confirmColumns.rows",
        },
        "storeResponseAs": "columnsCreated"
      }]
    },
    {
      "id": "getDataPrompt",
      "title": "Describe Your Data",
      "description": "Describe the data you'd like to generate for your sheet. This will be used to generate the rows of data.",
      "type": "prompt",
      "nextStepId": "confirmData",
      "fields": [
        {
          "id": "prompt",
          "type": "textarea",
          "label": "Prompt",
          "required": true
        }
      ],
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/gemini-prompt",
        "promptContext": "Follow these instructions carefully: You will receive a list of column data that belong to a Smartsheet. Each column data has a column_name and a column_type. You must generate a list of dictionaries, where each dictionary represents a row of data for the Smartsheet. The keys of the dictionary should match the column names, and the values should be examples of the data you want to include in each column. DATE should be formatted as YYYY-MM-DD (ISO 8601). ABSTRACT_DATETIME and DATETIME should be formatted as YYYY-MM-DDTHH:MM:SSZ (ISO 8601) else blank. CONTACT_LIST should be a valid email address. (e.g., 'johndoe@example.com'). If the column is a DURATION, it must be an integer (e.g., 30). If the column represents a percentage, it should be an integer between 0 and 100 (e.g., 50). If the column is a CHECKBOX, it should be either true or false. Return a minimum of 10 rows of data, unless otherwise specified. More rows is better, the description asks for 'detailed' - Give 20 rows. Column Data: {columns}. User Description of Data: {prompt}. Generate the rows of data and return them as a JSON array.",
        "method": "POST",
        "inputMapping": {
          "columns": "confirmColumns.rows",
          "prompt": "prompt",
        },
        "storeResponseAs": "mockData"
      }]
    },
    {
      "id": "confirmData",
      "title": "Confirm and Create Sheet",
      "type": "grid",
      "editable": false,
      "dataSource": "mockData",
      "description": "Review the generated rows below. Click 'Submit' to proceed.",
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/tools/sheetgenie",
        "method": "POST",
        "inputMapping": {
          "sheet_id": "getSheetId.sheetId",
          "rows": "confirmData.rows",
        },
      }]
    },

  ],
  "Demo Customizer": [
    {
      "id": "getRunInfo",
      "title": "Run Information",
      "description": "Fill out the following fields.",
      "type": "form",
      "nextStepId": "getTags",
      "fields": [
        {
          "id": "folderIds",
          "type": "input",
          "label": "Folder IDs",
          "required": true
        },
        {
          "id": "workspaceIds",
          "type": "input",
          "label": "Workspace IDs",
          "required": true
        },
        {
          "id": "runName",
          "type": "input",
          "label": "Run Name",
          "required": true
        },
        {
          "id": "opportunityId",
          "type": "input",
          "label": "Opportunity ID",
          "required": true
        },
        {
          "id": "templateCategory",
          "type": "select",
          "label": "Template Category",
          "options": [
            { "value": "PPM", "label": "PPM" },
            { "value": "ITPM", "label": "ITPM" },
            { "value": "Services Delivery", "label": "Services Delivery" },
            { "value": "Certification", "label": "Certification" }
          ],
          "required": true
        },
        {
          "id": "templateType",
          "type": "select",
          "label": "Template Type",
          "required": true,
          "dependsOn": {
            "fieldId": "templateCategory",
            "optionsMap": {
              "PPM": [
                { "value": "Tags", "label": "Tags" },
                { "value": "Tags Only", "label": "Tags Only" },
                { "value": "Enterprise PMO", "label": "Enterprise PMO" }
              ],
              "ITPM": [
                { "value": "Hardware", "label": "Hardware" },
                { "value": "Software", "label": "Software" }
              ],
              "Services Delivery": [
                { "value": "Option SD1", "label": "Option SD1" },
                { "value": "Option SD2", "label": "Option SD2" }
              ],
              "Certification": [
                { "value": "Option Cert1", "label": "Option Cert1" },
                { "value": "Option Cert2", "label": "Option Cert2" }
              ]
            }
          }
        }
      ],
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/get-tags",
        "storeResponseAs": "sheetInfo"
      }],
    },
    {
      "id": "",
      "title": "Get Template",
      "description": "Select the template you'd like to use for this run.",
      "type": "prompt",
      "nextStepId": "confirmTemplate",
      "fields": [
        {
          "id": "templateName",
          "type": "input",
          "label": "Template Name",
          "required": true
        }
      ],
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/get-template",
        "method": "POST",
        "inputMapping": {
          "template_name": "getTemplate.templateName"
        },
        "storeResponseAs": "template"
      }]
    },
    {
      "id": "confirmTemplate",
      "title": "Confirm Template",
      "description": "Review the template below. Click 'Next' to proceed.",
      "type": "grid",
      "dataSource": "template",
    }
  ],
  "QuickSheet": [
    {
      "id": "getSheetInfo",
      "title": "Get Sheet Information",
      "description": "Fill in the following fields.",
      "type": "form",
      "nextStepId": "getUseCase",
      "fields": [
        {
          "id": "sheetId",
          "type": "input",
          "label": "Sheet ID",
          "required": true
        },
        {
          "id": "rowCount",
          "type": "input",
          "label": "Number of Rows",
          "required": true,
        },
        {
          "id": "columnAction",
          "type": "select",
          "label": "How should we handle columns?",
          "options": [
            { "value": "create", "label": "Delete existing and create new columns" },
            { "value": "existing", "label": "Use existing column data" },
          ],
          "required": true
        },
        {
          "id": "rowAction",
          "type": "select",
          "label": "How should we handle the data?",
          "options": [
            { "value": "create", "label": "Add new rows to the bottom of the sheet" },
            { "value": "existing", "label": "Update existing rows" },
            { "value": "existing", "label": "Delete existing rows and replace with new rows" },
          ],
          "required": true
        }
      ],
      "onSubmit": [
        {
          "action": "getSheetInfo",
          "storeResponseAs": "sheetInfo",
          "apiEndpoint": "https://devapi.mbfcorp.tools/sheet",
          "method": "GET"

        }
      ]
    },
    {
      "id": "getUseCase",
      "title": "Describe Your Use Case",
      "description": "Describe the use case for which you'd like to generate mock data for. Be as specific as possible.",
      "type": "prompt",
      "nextStepId": "confirmColumns",
      "fields": [
        {
          "id": "prompt",
          "type": "textarea",
          "label": "Prompt",
          "required": true
        }
      ],
      "onSubmit": [
        {
          "condition": {
            "when": "getSheetInfo.columnAction",
            "equals": "create"
          },
          "action": "callApi",
          "apiEndpoint": "https://devapi.mbfcorp.tools/gemini-prompt",
          "promptContext": "I am creating a Smartsheet sheet for a {prompt} use case. Please provide a list of column headers that would be useful information for me to track on this sheet.",
          "method": "POST",
          "inputMapping": {
            "prompt": "prompt",
          },
          "storeResponseAs": "columns"
        },
        {
          "condition": {
            "when": "getSheetInfo.columnAction",
            "equals": "existing"
          },
          "action": "storeLocal",
          "storeDataAs": "columns",
          "dataToStore": {},
          "inputMapping": {
            "rows": "sheetInfo.columns",
            "schema": "sheetInfo.column_schema"
          }
        }
      ]
    },
    {
      "id": "confirmColumns",
      "title": "Confirm Columns",
      "description": "Review the generated columns below. If you selected 'Delete existing and create new columns', proceeding to the next step will create these columns. This will delete any existing columns (and data) in the sheet. If you selected 'Use existing column data', the following columns will be used to create the mock data.",
      "type": "grid",
      "editable": true,
      "dataSource": "columns",
      "nextStepId": "getDataPrompt",
      "onSubmit": [{
        "condition": {
          "when": "getSheetInfo.columnAction",
          "equals": "create"
        },
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/create-columns",
        "method": "POST",
        "inputMapping": {
          "sheet_id": "getSheetInfo.sheetId",
          "columns": "confirmColumns.rows",
        },
        "storeResponseAs": "columnsCreated"
      },
      {

        "action": "callApi",
        "prompt": true,
        "apiEndpoint": "https://devapi.mbfcorp.tools/gemini-prompt",
        "promptContext": "Follow these instructions carefully: You will receive a list of column data that belong to a Smartsheet. Each column data has a column_name and a column_type. You must generate a list of dictionaries, where each dictionary represents a row of data for the Smartsheet. The keys of the dictionary should match the column names, and the values should be examples of the data you want to include in each column. DATE should be formatted as YYYY-MM-DD (ISO 8601). DATETIME should be formatted as YYYY-MM-DDTHH:MM:SSZ (ISO 8601) else blank. CONTACT_LIST should be a valid email address. (e.g., 'johndoe@example.com'). If the column is a DURATION, it must be an integer (e.g., 30). If the column represents a PERCENTAGE, it should be a decimal between 0 and 1 (e.g., 0.6 without a percent symbol). If the column is a CHECKBOX, it should be either true or false. If the column represents a number or monetary value return an integer only (no additional text like $). If the column properties contains a list of options, select one of those but make it random and don't disperse evenly. Return a minimum of 20 rows unless Row count is specified. Row count: {rowCount} Column Data: {columns}. User Description of Data: {prompt}. Generate the rows of data and return them as a JSON array.",
        "method": "POST",
        "inputMapping": {
          "columns": "confirmColumns.rows",
          "prompt": "getUseCase.prompt",
          "rowCount": "getSheetInfo.rowCount"
        },
        "storeResponseAs": "mockData"
      }]
    },
    {
      "id": "confirmData",
      "title": "Confirm and Create Sheet",
      "type": "grid",
      "editable": false,
      "dataSource": "mockData",
      "description": "Review the generated rows below. Submit to create your sheet.",
      "onSubmit": [{
        "action": "callApi",
        "apiEndpoint": "https://devapi.mbfcorp.tools/tools/sheetgenie",
        "method": "POST",
        "inputMapping": {
          "sheet_id": "getSheetInfo.sheetId",
          "rows": "confirmData.rows",
        },
      }]
    },

  ],
}



export const Tool = () => {
  const [tool, setTool] = useState<ToolProps>();
  // const [showFormModal, setShowFormModal] = useState(false);
  const { slug } = useParams()

  useEffect(() => {
    if (slug) {
      const fetchData = async () => {
        try {
          const response = await fetch(`https://devapi.mbfcorp.tools/api/tools/${slug}`, {
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

  // const handleCloseFormModal = () => setShowFormModal(false);
  // const handleShowFormModal = () => setShowFormModal(true);
  // const handleFormSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const fetchData = async () => {
  //     try {
  //       setShowFormModal(false);
  //       const response = await fetch('https://devapi.mbfcorp.tools/api/tools/demo-customizer', {
  //         method: "POST",
  //         body: JSON.stringify({
  //           function: `toolkit-${slug}`,
  //           workspace_ids: '6420289752983428,6173999148361604',
  //           key_1: 'Parent 1',
  //           value_1: '..USM..',
  //           key_2: 'Parent 2',
  //           value_2: '..EKG..'
  //         }),
  //         credentials: 'include',
  //       });
  //       const toolData = await response.json();
  //       console.log("toolData: ", toolData);
  //     } catch (error) {
  //       console.log("Error: ", error)
  //     };
  //   }
  //   fetchData();
  // };

  return (
    <Container>
      {tool ? (
        <>
          {/* {tool.name === "Demo Customizer" && (
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
          )} */}
          <h4 className="mb-3 fw-bold text-primary">{tool.name}</h4>
          <p>{tool.summary}</p>
          <Steps steps={steps[tool.name]} />
        </>

      ) : <Spinner animation="border" variant="primary" />}
    </Container>
  )
}
