import { useEffect } from 'react';
import { useTool } from '../ToolContext';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { FormStep as FormStepType, FormField } from '../../types';
import EditableGrid from '../EditableGrid';
import { checkDisplayCondition } from '../../utils/conditions'

const FormFieldRenderer = ({ field }: { field: FormField }) => {
  const { formData, jobResults, validationErrors, updateFormField } = useTool();
  const value = formData[field.id];
  const error = validationErrors[field.id];

useEffect(() => {
    if (field.sourceDataKey) {
      const sourceData = jobResults[field.sourceDataKey];
      const formDataForField = formData[field.id];

      if (sourceData && !formDataForField) {
        
        let dataToSync;
        if (field.sourceDataPath) {
          dataToSync = sourceData[field.sourceDataPath];
        } else {
          dataToSync = sourceData;
        }
        if (dataToSync !== undefined) {
          updateFormField(field.id, dataToSync);
        }
      }
    }
  }, [field.sourceDataKey, field.sourceDataPath, jobResults, formData, field.id, updateFormField]); // <-- Added sourceDataPath to dependency array


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      updateFormField(field.id, null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string; 
      const imagePayload = {
        data: base64String,
        mime_type: file.type,
        name: file.name,
      };
      updateFormField(field.id, imagePayload);
    };
    reader.readAsDataURL(file);
  };

  console.log("formData", formData)

  switch (field.type) {
    case 'grid': {
      const sourceKey = field.sourceDataKey;
      if (!sourceKey) {
        return <Alert variant="danger">Grid field is missing 'sourceDataKey'.</Alert>;
      }

      const schema = jobResults[sourceKey]?.schema;
      const gridRows = value; 

      if (!gridRows || !schema) {
        return <p>Loading data...</p>;
      }

      return (
        <>
          <EditableGrid
            fieldId={field.id}
            schema={schema}
            rows={gridRows}
            editable={field.editable}
          />
          {error && <div className="text-danger mt-2">{error}</div>}
        </>
      );
    }

    case 'file':
      return (
        <>
          <Form.Control
            type="file"
            required={field.required}
            multiple={field.attributes?.multiple}
            accept={field.attributes?.accept}
            onChange={handleFileChange}
            isInvalid={!!error}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </>

      );
    case 'number': 
      return (
        <><Form.Control
            type="number"
            required={field.required}
            placeholder={field.attributes?.placeholder || ''}
            value={value || ''}
            isInvalid={!!error}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormField(field.id, e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </>
      )
    case 'textarea': 
      return (
        <>
          <Form.Control
            as="textarea"
            required={field.required}
            placeholder={field.attributes?.placeholder || ''}
            value={value || ''}
            isInvalid={!!error}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormField(field.id, e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </>
      )
    case 'select':
      return (
        <>
          <Form.Select
            required={field.required}
            value={value || ''}
            isInvalid={!!error}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFormField(field.id, e.target.value)}
          >
            <option value="" disabled>Select an option...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </>
      );
    default: {
      const displayValue = typeof value === 'object' && value !== null ? '' : value || '';
      return (
        <>
          <Form.Control
            type="text"
            required={field.required}
            placeholder={field.attributes?.placeholder || ''}
            value={displayValue}
            isInvalid={!!error}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormField(field.id, e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </>

      );
    }
  }
};

const FormStep = ({ step }: { step: FormStepType }) => {
  const { executeAction, isLoading, goBack, stepHistory, formData } = useTool();

  const visibleFields = step.fields?.filter(field => 
    checkDisplayCondition(field.displayCondition, formData)
  );

  const visibleActions = step.actions.filter(action =>
    checkDisplayCondition(action.displayCondition, formData)
  );

  return (
    <div>
      <h5>{step.title}</h5>
      {step.content && <p className="text-muted">{step.content}</p>}
      <Form onSubmit={(e) => e.preventDefault()}>
        {/* 3. Map over the FILTERED array of fields */}
        {visibleFields?.map(field => (
          <Form.Group key={field.id} className="mb-3" controlId={field.id}>
            {field.type !== 'grid' && <Form.Label>{field.label}</Form.Label>}
            {field.type !== 'grid' && field.required && <span className="text-danger ms-1">*</span>}
            <FormFieldRenderer field={field} />
          </Form.Group>
        ))}
      </Form>
      <hr />
      <div className="d-flex justify-content-between">
        <div>
          {stepHistory.length > 1 && (
            <Button variant="secondary" onClick={goBack} disabled={isLoading}>
              Back
            </Button>
          )}
        </div>
        <div className="d-flex justify-content-end">
          {visibleActions.map((action, index) => (
            <Button
              key={index}
              onClick={() => executeAction(action)}
              disabled={isLoading}
              variant="primary"
              className={visibleActions.length > 1 ? "ms-2" : ""}
            >
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Processing...</span>
                </>
              ) : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormStep;