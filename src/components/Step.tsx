import React from 'react';
import { Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Step as StepType } from '../types';
import { Grid } from './Grid';

interface StepProps {
  step: StepType;
  isCurrentStep: boolean;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onInputChange: (stepId: string, fieldId: string, value: any) => void;
  onNextStep: (stepId: string) => void;
  isLoadingThisStep: boolean;
  isLastStep: boolean;
  responseData: Record<string, any>;
}

export const Step: React.FC<StepProps> = ({
  step,
  isCurrentStep,
  formData,
  setFormData,
  onInputChange,
  onNextStep,
  isLoadingThisStep,
  responseData,
  isLastStep,
}) => {
  return (
    <Card style={{ width: '100%' }} className="h-100 mb-3">
      <Card.Body>
        <Card.Title><b>{step.title}</b></Card.Title>
        <p>{step.description}</p>
        {step?.fields?.map((field) => (
          <div key={field.id} className="mb-3">
            {field.type === "input" && (
              <InputGroup>
                <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                <Form.Control
                  value={formData[step.id]?.[field.id] || ''}
                  onChange={(e) => onInputChange(step.id, field.id, e.target.value)}
                  disabled={!isCurrentStep || isLoadingThisStep}
                />
              </InputGroup>
            )}
            {field.type === "textarea" && (
              <InputGroup>
                <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                <Form.Control
                  as="textarea"
                  value={formData[step.id]?.[field.id] || ''}
                  onChange={(e) => onInputChange(step.id, field.id, e.target.value)}
                  disabled={!isCurrentStep || isLoadingThisStep}
                />
              </InputGroup>
            )}
            {field.type === "upload" && (
              <InputGroup>
                <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                <Form.Control
                  type="file"
                  onChange={(e) => onInputChange(step.id, field.id, e.target.value)}
                  disabled={!isCurrentStep || isLoadingThisStep}
                />
              </InputGroup>
            )}
          </div>
        ))}
        {step.type === "grid" && step.dataSource && responseData[step.dataSource] && (
          <Grid
            gridData={responseData[step.dataSource]}
            editable={step.editable}
            stepId={step.id}
            formData={formData}
            setFormData={setFormData}
            disabled={!isCurrentStep || isLoadingThisStep}
          />
        )}
        <div className="d-grid gap-2">
          <Button
            variant="primary"
            type="button"
            className="float-end"
            onClick={() => onNextStep(step.id)}
            disabled={!isCurrentStep || isLoadingThisStep}
          >
            {isLoadingThisStep ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Loading...</span>
              </>
            ) : (
              isLastStep ? "Submit" : "Next"
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default React.memo(Step);