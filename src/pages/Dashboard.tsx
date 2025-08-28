import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { ToolCard } from "../components/ToolCard";
import { ToolSummaryProps } from "../types";

export const Dashboard = () => {
  const [tools, setTools] = useState<ToolSummaryProps[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://devapi.mbfcorp.tools/api/tools', {
          credentials: 'include',
        });
        const toolData = await response.json();
        setTools(toolData);
      } catch (error) {
        console.log("Error fetching tool data: ", error)
      };
    }
    fetchData();
  }, []);

  return (
    <Container fluid className="d-flex flex-wrap gap-3">
      {tools.length ? tools.map((tool) => {
        return (
          <ToolCard key={tool.id} tool={tool} />
        )
      }): <Spinner animation="border" variant="primary" />}
    </Container>
  )
}