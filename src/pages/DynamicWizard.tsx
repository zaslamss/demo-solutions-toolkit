import  { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Container, Spinner, Alert } from 'react-bootstrap';

import { useTool } from '../components/ToolContext';
import ProgressTracker from '../components/ProgressTracker'; 
import FormStep from '../components/steps/FormStep';
import SuccessStep from '../components/steps/SuccessStep';
import ErrorStep from '../components/steps/ErrorStep';


export const DynamicWizard = () => {
  const { toolDefinition, currentStep, isLoading, error, loadTool } = useTool();
  const { slug } = useParams()

  useEffect(() => {
    if (slug && (!toolDefinition || toolDefinition.id !== slug)) {

      loadTool(slug);
    }
  }, [slug, toolDefinition, loadTool]);

  if (!toolDefinition && isLoading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading Tool...</span>
        </Spinner>
        <p>Loading...</p>
      </Container>
    );
  }

  if (error && !toolDefinition) {
     return <Alert variant="danger">Error: {error}</Alert>
  }

  if (!currentStep) {
    return <Alert variant="warning">Tool loaded, but no active step found.</Alert>;
  }

  const renderStep = () => {
    switch (currentStep.type) {
      case 'form':
        return <FormStep step={currentStep} />;
      case 'success':
        return <SuccessStep step={currentStep} />;
      case 'error':
        return <ErrorStep step={currentStep} />;
      default:
        return <Alert variant="danger">Error: Unknown step type encountered.</Alert>;
    }
  };

  return (
    <Container className="my-5">
      <Card className="border-0 shadow-sm">
        <Card.Header as="h4" className="bg-white">{toolDefinition?.name || 'Loading...'}</Card.Header>
        <Card.Body className="p-4">
          {toolDefinition && <ProgressTracker steps={toolDefinition.steps} />}
          <hr className="mb-4" />
          {renderStep()}
        </Card.Body>
      </Card>
    </Container>
  );
};
