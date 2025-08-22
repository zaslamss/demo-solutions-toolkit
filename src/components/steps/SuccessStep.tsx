import { useEffect } from 'react';
import { useTool } from '../ToolContext'; 
import { WizardStep } from '../../types';
import { Button } from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons';

const SuccessStep = ({ step }: { step: WizardStep }) => {
  const { resetTool, toolDefinition } = useTool();
  useEffect(() => {
    localStorage.removeItem('toolSessionState');
  }, []);

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