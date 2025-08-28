import { useTool } from '../ToolContext';
import { WizardStep } from '../../types';
import { Button } from 'react-bootstrap';
import { CheckCircleFill, BoxArrowUpRight } from 'react-bootstrap-icons';

const SuccessStep = ({ step }: { step: WizardStep }) => {
  const { resetTool, toolDefinition, jobResults } = useTool();
  const permalinks = jobResults.permalinks || [];

  const handleStartAnother = () => {
    if (toolDefinition) {
      resetTool();
    }
  };

  return (
    <div className="success-step-container">
      <CheckCircleFill className="success-icon" />
      <h3 className="mt-3">{step.title}</h3>
      <p className="text-muted mt-2">{step.content}</p>
      {permalinks.length > 0 && (
        <ul>
          {permalinks.map((link: string, index: number) => (
            <li className="d-flex" key={index}>
              <BoxArrowUpRight className="me-2" />
              <a href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="primary"
        className="mt-4"
        onClick={handleStartAnother}
      >
        Start Another Job
      </Button>
    </div>
  );
};

export default SuccessStep;