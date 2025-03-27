import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { ToolSummaryProps } from "../types";

interface ToolCardProps {
  tool: ToolSummaryProps;
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link to={`tools/${tool.slug}`} style={{ textDecoration: 'none' }}>
      <Card style={{ width: '18rem' }} className="h-100">
        <Card.Body>
          <Card.Title>{tool.name}</Card.Title>
          <Card.Text>
            {tool.summary}
          </Card.Text>
        </Card.Body>
      </Card>
    </Link>
  )
}