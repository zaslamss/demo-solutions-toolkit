// TODO: See if we still want this.

// Bootstrap Imports
import { Container } from "react-bootstrap";

// Types Import
import { ToolDescriptionProps } from "../types";
interface DescriptionProps {
  description: ToolDescriptionProps[]
}

export const Description = ({ description }: DescriptionProps) => {
  return (
    <>
      {description.map((section, index) => {
        return (
          <Container key={index} className="mb-4">
            <h6 className="fw-bold">{section.heading}</h6>
            {section.type === "text" &&
              section.content.map((text, i) => (
                <p key={i} className="mb-3">{text}</p>
              ))}

            {section.type === "ordered" && (
              <ol>
                {section.content.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ol>
            )}

            {section.type === "unordered" && (
              <ul>
                {section.content.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            )}
          </Container>
        );
      })}
    </>
  )
}