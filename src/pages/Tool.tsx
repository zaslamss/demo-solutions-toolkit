// React + Third Party Libraries
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Accordion, Button, Container } from "react-bootstrap";

// Components
import { DynamicFormModal } from "../components/DynamicFormModal";
import { Description } from "../components/Description";
import Runs from "../components/Runs";
import { InteractiveSteps } from "../components/InteractiveSteps";

// Types
import { ToolProps, Run } from "../types";


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
          {tool.name === "Mock Data Tool" && (
            <>
            <h4 className="mb-3 fw-bold">{tool.name}</h4>
            <p>{tool.summary}</p>
            <InteractiveSteps />
            </>)}
        </>

      ) : <h6>Loading...</h6>}
    </Container>
  )
}
