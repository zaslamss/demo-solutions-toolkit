import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { ToolSummaryProps } from "../types";

import ToolCard from "./ToolCard";

export default function Dashboard() {
  const [tools, setTools] = useState<ToolSummaryProps[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/tools', {
          credentials: 'include',
        });
        const toolData = await response.json();
        setTools(toolData);
      } catch (error) {
        console.log("Error: ", error)
      };
    }
    fetchData();
  }, []);

  return (
    <Container fluid className="d-flex flex-wrap gap-3">
      {tools.map((tool) => {
        return (
          <ToolCard key={tool.id} tool={tool} />
        )
      })}
    </Container>
  )
}