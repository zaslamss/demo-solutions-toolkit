import { Container } from "react-bootstrap";
import { ToolDescriptionProps } from "../types";

interface DescriptionProps {
    description: ToolDescriptionProps[]
}

export default function Description({ description }: DescriptionProps) {
    return (
        <Container fluid>
            {description.map((section, index) => {
                return (
                <Container key={index} className="mb-4">
                    <h5>{section.heading}</h5>
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
        </Container>
    )
}