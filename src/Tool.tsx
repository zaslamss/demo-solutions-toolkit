import "@smartsheet/design-tokens/dist/css/sds-tokens.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DynamicForm from "./DynamicForm";
import { Container, Tab, Tabs } from "react-bootstrap";
import Description from "./components/Description";
import { ToolDescriptionProps } from "./types";

interface Tool {
  name: string;
  description: ToolDescriptionProps[];
  form: Field[];
}

interface Option {
  value: string;
  label: string;
}

interface Field {
  id: string;
  label: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: Option[];
  visibility?: {
    dependsOn: string;
    value?: string;
    condition: "answered" | "eq";
  };
  conditionalOptions?: {
    dependsOn: string;
    condition: "answered" | "eq";
    value?: string;
    options: Record<string, Option[]>;
  }
  conditionalValues?: {
    dependsOn: string;
    condition: "answered" | "eq";
    value?: string;
    values: Record<string, string>;
  }
  fetchOptions?: {
    endpoint: string;
    params: Record<string, string>;
  };
  prefill?: Record<string, any>;
}

const tool_api: Record<string, Tool> = {
  "demo-customizer": {
    "name": "Demo Customizer",
    "description": [
      {
        "heading": "What this tool does",
        "type": "text",
        "content": ["This tool will do a mass find & replace within the folders/workspaces specified. It will search for keys in the following format: '..KEY..', and replace them with the values you provide. This find/replace will happen across column properties, sheet info, cell data, formulas, etc.", "You will also have the ability to undo your action. This can allow you to prepare demos that you can quickly customize to contain customer data, then quickly revert/reset.", "If your demo workspace/folder includes a sheet with the exact name '__DemoCustomizer Configuration__', this sheet will then be checked for additional tasks that need to be performed. To create a starter config sheet you can use the distribution link here. Further documentation on the different tasks that can be created and how to enable them can be found inside of the sample config sheet."]
      },
      {
        "heading": "When to use this tool",
        "type": "text",
        "content": ["Use this tool when you have a demo that has been prepared for it. This will enable you to quickly customize your demo to be specific to your customer."]
      },
      {
        "heading": "Instructions",
        "type": "ordered",
        "content": ["Enter comma-separated sheet and/or folder IDs.", "List out any keys that you will want to replace or apply a template.", "Enter the replacements you would like to see and/or upload images to be inserted into cells.", "Click run"]
      },
      {
        "heading": "Notes and Warnings",
        "type": "unordered",
        "content": ["The undo functionality of this tool will ONLY undo tasks that the tool performed. This means that if you make additional changes, they will not be reverted. For example, if you run this tool, then manually add a row to a sheet, clicking Undo will not delete this row."]
      }
    ],
    "form": [
      {
        "id": "folder_ids",
        "label": "Demo Folder ID(s)",
        "description": "Comma-separated Folder IDs. To obtain the Folder IDs, right-click on the Folder and select 'Properties'...",
        "type": "text"
      },
      {
        "id": "workspace_ids",
        "label": "Demo Workspace ID(s)",
        "description": "Comma-separated Workspace IDs. To obtain the Workspace IDs, right-click on the Workspace and select 'Properties'...",
        "type": "text",
      },
      {
        "id": "opportunity_id",
        "label": "Opportunity ID",
        "description": "If this is being used for a specific opportunity, help us track Demo Customizer usage by providing an opportunity ID",
        "type": "text",
      },
      {
        "id": "run_name",
        "label": "Run Name",
        "description": "Name your run for future reference. If no name is provided the workspace name will be used",
        "type": "text",
      },
      {
        "id": "category",
        "label": "Template Category",
        "type": "dropdown",
        "options": [
          { "value": "", "label": "CLEAR ALL" }, { "value": "certification", "label": "Certification" }, { "value": "epmo", "label": "EPMO" }, { "value": "proserv", "label": "ProServ" }, { "value": "ppm", "label": "PPM" }
        ]
      },
      {
        "id": "template",
        "label": "Apply Template",
        "type": "dropdown",
        "visibility": {
          "dependsOn": "category",
          "condition": "answered"
        },
        "conditionalOptions": {
          "dependsOn": "category",
          "condition": "answered",
          "options": {
            "certification": [
              { "value": "certification_tags_only", "label": "Tags Only" },
              { "value": "certification_accreditation", "label": "Accreditation" },
              { "value": "certification_certification", "label": "Certification" },
              { "value": "certification_award", "label": "Award" },
            ],
            "epmo": [
              { "value": "epmo_tags_only", "label": "Tags Only" },
              { "value": "epmo_template", "label": "Template" }
            ],
            "proserv": [
              { "value": "proserv_tags", "label": "Tags Only" },
              { "value": "proserv_template", "label": "Template" }
            ],
            "ppm": [
              { "value": "ppmo_tags_only", "label": "Tags Only" },
              { "value": "ppmo_enterprise_pmo", "label": "Enterprise PMO" }
            ],
          },
        },
      },
      {
        "id": "key_1",
        "label": "Tag 1",
        "type": "text",
        "conditionalValues": {
          "dependsOn": "template",
          "condition": "answered",
          "values": {
            "certification_tags_only": "Certification Key 1",
            "certification_accreditation": "Accreditation Key 1",
            "certification_certification": "Certification C Key 1",
            "certification_award": "Award Key 1"
          }
        }
      },
      {
        "id": "value_1",
        "label": "Replace with...",
        "type": "text",
        "conditionalValues": {
          "dependsOn": "template",
          "condition": "answered",
          "values": {
            "certification_tags_only": "Certification Value 1",
            "certification_accreditation": "Accreditation Value 1",
            "certification_certification": "Certification C Value 1",
            "certification_award": "Award Value 1"

          }
        }
      },
      {
        "id": "key_2",
        "label": "Tag 2",
        "type": "text",
        "visibility": {
          "dependsOn": "key_1",
          "condition": "answered"
        },
        "conditionalValues": {
          "dependsOn": "template",
          "condition": "answered",
          "values": {
            "certification_tags_only": "Certification Key 2",
            "certification_accreditation": "Accreditation Key 2",
            "certification_certification": "Certification C Key 2",

          }
        }
      },
      {
        "id": "value_2",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_1",
          "condition": "answered"
        },
        "conditionalValues": {
          "dependsOn": "template",
          "condition": "answered",
          "values": {
            "certification_tags_only": "Certification Value 2",
            "certification_accreditation": "Accreditation Value 2",
            "certification_certification": "Certification C Value 2",

          }
        }
      },
      {
        "id": "key_3",
        "label": "Tag 3",
        "type": "text",
        "visibility": {
          "dependsOn": "key_2",
          "condition": "answered"
        }
      },
      {
        "id": "value_3",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_2",
          "condition": "answered"
        }
      },
      {
        "id": "key_4",
        "label": "Tag 4",
        "type": "text",
        "visibility": {
          "dependsOn": "key_3",
          "condition": "answered"
        }
      },
      {
        "id": "value_4",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_3",
          "condition": "answered"
        }
      },
      {
        "id": "key_5",
        "label": "Tag 5",
        "type": "text",
        "visibility": {
          "dependsOn": "key_4",
          "condition": "answered"
        }
      },
      {
        "id": "value_5",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_4",
          "condition": "answered"
        }
      },
      {
        "id": "key_6",
        "label": "Tag 6",
        "type": "text",
        "visibility": {
          "dependsOn": "key_5",
          "condition": "answered"
        }
      },
      {
        "id": "value_6",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_5",
          "condition": "answered"
        }
      },
      {
        "id": "key_7",
        "label": "Tag 7",
        "type": "text",
        "visibility": {
          "dependsOn": "key_6",
          "condition": "answered"
        }
      },
      {
        "id": "value_7",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_6",
          "condition": "answered"
        }
      },
      {
        "id": "key_8",
        "label": "Tag 8",
        "type": "text",
        "visibility": {
          "dependsOn": "key_7",
          "condition": "answered"
        }
      },
      {
        "id": "value_8",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_7",
          "condition": "answered"
        }
      },
      {
        "id": "key_9",
        "label": "Tag 9",
        "type": "text",
        "visibility": {
          "dependsOn": "key_8",
          "condition": "answered"
        }
      },
      {
        "id": "value_9",
        "label": "Replace with...",
        "type": "text",
        "visibility": {
          "dependsOn": "key_8",
          "condition": "answered"
        }
      }
    ]
  }
}


function Tool() {
  const [tool, setTool] = useState<Tool>();
  const { slug } = useParams()

  useEffect(() => {
    // TODO: Convert this to an API call to retrieve the data
    if (slug) {
      const tool_data = tool_api[slug]
      setTool(tool_data);
    }

  }, []);

  return (
    <Container>
      <h3>{tool?.name}</h3>
      <Tabs
        defaultActiveKey="form"
        id="uncontrolled-tab-example"
        className="mb-3"
        fill
      >
        <Tab eventKey="description" title="Description">
          {tool ? <Description description={tool.description} /> : null }
        </Tab>
        <Tab eventKey="form" title="Use the Tool">
          {
            tool ? <DynamicForm fields={tool.form}></DynamicForm> : null
          }
        </Tab>
        <Tab eventKey="runs" title="Runs">
          Tab content for all the runs
        </Tab>
      </Tabs>

    </Container>
  )
}

export default Tool
