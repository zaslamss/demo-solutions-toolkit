// TODO: See if we even still want this.

// React Imports
import React, { useEffect, useRef, useState } from 'react';

// Bootstrap Imports
import { Form, Row, Col, Button, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';

// Types Import
import { ToolFieldProps } from '../types';

interface DynamicFormModalProps {
  toolName: string;
  formConfig: ToolFieldProps[];
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export const DynamicFormModal: React.FC<DynamicFormModalProps> = ({ formConfig, toolName, show, onClose, onSubmit }) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const prevFormValues = usePrevious(formValues);

  // Reset fields if their dependencies changed
  useEffect(() => {
    if (!prevFormValues) return;

    const updates: Record<string, string> = {};
    for (const field of formConfig) {
      const currentValue = formValues[field.id] || '';
      if (!field.reset || !currentValue) continue;

      const shouldReset = field.reset.some(dep => prevFormValues[dep] !== formValues[dep]);
      if (shouldReset) {
        updates[field.id] = '';
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormValues(prev => ({ ...prev, ...updates }));
    }
  }, [formValues]);

  // Prefill fields based on conditionalValues
  useEffect(() => {
    const updates: Record<string, string> = {};

    for (const field of formConfig) {
      const currentValue = formValues[field.id];
      if (currentValue) continue;

      const cond = field.conditionalValues;
      if (
        cond?.condition === 'answered' &&
        formValues[cond.dependsOn] &&
        cond.values[formValues[cond.dependsOn]]
      ) {
        updates[field.id] = cond.values[formValues[cond.dependsOn]];
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormValues(prev => ({ ...prev, ...updates }));
    }
  }, [formValues]);

  // Render a single field
  const renderField = (field: ToolFieldProps) => {
    const value = formValues[field.id] || '';
    const isVisible = !field.visibility || (
      field.visibility.condition === 'answered' &&
      !!formValues[field.visibility.dependsOn]
    );
    if (!isVisible) return null;

    const dropdownOptions =
      field.conditionalOptions?.condition === 'answered' &&
        formValues[field.conditionalOptions.dependsOn]
        ? field.conditionalOptions.options[formValues[field.conditionalOptions.dependsOn]] || []
        : field.options || [];

    return (
      <Col key={field.id} md={field.layout?.col || 12}>
        <Form.Group className="mb-3 bg-light p-2 rounded">
          <Form.Label className="fw-light fs-6">
            {field.label}
            {field.description && (
              <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  {field.description}
                </Tooltip>
              }
            >
              <span style={{ marginLeft: 6, cursor: 'pointer', color: '#0d6efd' }}>❓</span>
            </OverlayTrigger>
            )}
          </Form.Label>
          {field.type === 'dropdown' ? (
            <Form.Select
              size="sm"
              value={value}
              onChange={(e) => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
            >
              {dropdownOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          ) : (
            <Form.Control
              size="sm"
              type="text"
              value={value}
              onChange={(e) => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
            />
          )}
        </Form.Group>
      </Col>
    );
  };

  // Group fields by rowGroup or unique ID fallback
  const groupedFields = formConfig.reduce<Record<string, ToolFieldProps[]>>((acc, field) => {
    const group = field.layout?.rowGroup || `__${field.id}`;
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  return (
    <Modal show={show} onHide={onClose} dialogClassName="modal-90w">
    <Modal.Header closeButton>
      <Modal.Title>{toolName}</Modal.Title>
    </Modal.Header>
    <Modal.Body><Form id="run-submit" onSubmit={onSubmit}>
      {Object.entries(groupedFields).map(([groupKey, fields]) => (
        <Row key={groupKey}>
          {fields.map(renderField)}
        </Row>
      ))}
    </Form></Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button type="submit" form="run-submit">
        Run
      </Button>
    </Modal.Footer>
  </Modal>
  );
};
