import React from 'react';
import { Alert, Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Step as StepType, StepMessage } from '../types';
import { Grid } from './Grid';


interface StepProps {
  step: StepType;
  isCurrentStep: boolean;
  currentStepIndex: number;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onInputChange: (stepId: string, fieldId: string, value: any) => void;
  onNextStep: (stepId: string) => void;
  onPreviousStep: () => void;
  isLoadingThisStep: boolean;
  isLastStep: boolean;
  responseData: Record<string, any>;
  message?: StepMessage;
}

interface UploadedFileData {
  data: string;
  mime_type: string;
}

export const Step: React.FC<StepProps> = ({
  step,
  isCurrentStep,
  currentStepIndex,
  formData,
  setFormData,
  onInputChange,
  onNextStep,
  onPreviousStep,
  isLoadingThisStep,
  responseData,
  isLastStep,
  message
}) => {

  const getVariantFromLevel = (level: "INFO" | "WARNING" | "ERROR") => {
    switch (level) {
      case "INFO":
        return "success";
      case "WARNING":
        return "warning";
      case "ERROR":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>, stepId: string, fieldId: string) => {
    const file = e.target.files?.[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        console.error('Please upload an image file.');
        e.target.value = '';
        onInputChange(stepId, fieldId, null);
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        const mimeType = file.type;

        if (base64String && mimeType) {
          onInputChange(stepId, fieldId, { data: base64String, mime_type: mimeType });
        } else {
          console.error("Failed to read file as Base64.");
          onInputChange(stepId, fieldId, null);
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        onInputChange(stepId, fieldId, null);
      };

      reader.readAsDataURL(file);
    } else {
      onInputChange(stepId, fieldId, null);
    }
  };

  const getFilePreview = (fieldId: string) => {
    const fileData: UploadedFileData | null = formData[step.id]?.[fieldId];
    if (fileData && fileData.data && fileData.mime_type) {
      return (
        <div className="mt-2">
          <h6>Image Preview:</h6>
          <img
            src={`data:${fileData.mime_type};base64,${fileData.data}`}
            alt="Preview"
            style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }}
          />
        </div>
      );
    }
    return null;
  };

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
                  required={field.required}
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
              <>
                <InputGroup>
                  <InputGroup.Text id={field.id}>{field.label}</InputGroup.Text>
                  <Form.Control
                    type="file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUploadChange(e, step.id, field.id)}
                    disabled={!isCurrentStep || isLoadingThisStep}
                    accept="image/*"
                  />
                </InputGroup>
                {getFilePreview(field.id)}
              </>
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
        <div className="d-flex justify-content-between gap-2 mt-3">
          {isCurrentStep && currentStepIndex > 0 && (
            <Button variant="secondary" className="flex-fill" onClick={onPreviousStep}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            type="button"
            className="flex-fill"
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
        {message ? (
          <Alert key={getVariantFromLevel(message.level)} variant={getVariantFromLevel(message.level)} className="mt-4 p-2">
            {message.message}
          </Alert>
        ) : null}
      </Card.Body>
    </Card>
  );
};

export default React.memo(Step);