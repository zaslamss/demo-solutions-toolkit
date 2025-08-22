import { useTool } from '../ToolContext'; 
import { WizardStep } from '../../types';
import { Button, Alert } from 'react-bootstrap';
import { XCircleFill } from 'react-bootstrap-icons';

const ErrorStep = ({ step }: { step: WizardStep }) => {
  const { error, goBack } = useTool();

  return (
    <div className="error-step-container">
      <XCircleFill className="error-icon" />
      <h3 className="mt-3 text-danger">{step.title}</h3>
      
      <p className="text-muted mt-2">{step.content}</p>

      {error && (
        <Alert variant="danger" className="mt-4 text-start w-100">
          <strong>Error Details:</strong>
          <pre className="mb-0 mt-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {error}
          </pre>
        </Alert>
      )}
      
      <Button
        variant="secondary"
        className="mt-4"
        onClick={goBack}
      >
        Go Back and Try Again
      </Button>
    </div>
  );
};

export default ErrorStep;