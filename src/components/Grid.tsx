import { useState, useMemo } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { EditFeatures, EditCondition } from "../types";

type FieldType = "text" | "select" | "checkbox";

type SchemaField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
};

type RowData = {
  id: string;
  [key: string]: any;
};

type GridProps = {
  gridData: {
    schema: SchemaField[];
    rows: RowData[];
  };
  stepId: string;
  // Change 'editable' to 'editFeatures'
  editFeatures?: EditFeatures; // Now an optional object
  formData: Record<string, any>; // This should contain all step data
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  disabled?: boolean;
};

export const Grid = ({ gridData, stepId, formData, editFeatures, setFormData, disabled }: GridProps) => {
  const [schema] = useState<SchemaField[]>(gridData.schema || []);
  const rows = formData[stepId]?.rows || [];

  // 1. Helper function to safely get a nested value from an object
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // 2. Function to evaluate a given condition
  const evaluateCondition = (condition?: EditCondition | null): boolean => {
    if (!condition) {
      return true; // If no condition is specified, it's considered true
    }

    const { when, equals } = condition;
    const valueToCheck = getNestedValue(formData, when); // Get the value from formData

    // Basic equality check. Extend this for more operators if needed.
    return valueToCheck === equals;
  };

  // 3. Memoized calculation of active edit capabilities
  const activeEditCapabilities = useMemo(() => {
    const capabilities = {
      canEditGridText: false,
      canDeleteRow: false,
      canAddRow: false,
    };

    if (!editFeatures) {
      return capabilities; // No edit features configured
    }

    // Evaluate each feature's condition
    if (editFeatures.gridText) {
      capabilities.canEditGridText = editFeatures.gridText.enabled && evaluateCondition(editFeatures.gridText.condition);
    }
    if (editFeatures.deleteRow) {
      capabilities.canDeleteRow = editFeatures.deleteRow.enabled && evaluateCondition(editFeatures.deleteRow.condition);
    }
    if (editFeatures.addRow) {
      capabilities.canAddRow = editFeatures.addRow.enabled && evaluateCondition(editFeatures.addRow.condition);
    }

    return capabilities;
  }, [editFeatures, formData]); // Re-evaluate when editFeatures or formData changes

  // Destructure for easier access
  const { canEditGridText, canDeleteRow, canAddRow } = activeEditCapabilities;


  // Function to update a cell in the grid
  const updateCell = (id: string, key: string, value: any) => {
    // Only allow update if gridText is editable
    if (!canEditGridText) return;

    setFormData((prev: any) => {
      const existingRows = prev[stepId].rows || [];
      const updatedRows = existingRows.map((row: any) => {
        if (row.id === id) {
          return { ...row, [key]: value };
        }
        return row;
      });
      return {
        ...prev,
        [stepId]: { ...prev[stepId], rows: updatedRows } // Ensure other step data is preserved
      };
    });
  };

  // Function to delete a row from the grid
  const deleteRow = (id: string) => {
    // Only allow deletion if canDeleteRow
    if (!canDeleteRow) return;

    setFormData((prev: any) => {
      const existingRows = prev[stepId].rows || [];
      const updatedRows = existingRows.filter((row: any) => row.id !== id);
      return {
        ...prev,
        [stepId]: { ...prev[stepId], rows: updatedRows } // Ensure other step data is preserved
      };
    });
  };

  const generate_uuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Function to add a new row to the grid
  const addRow = () => {
    // Only allow addition if canAddRow
    if (!canAddRow) return;

    const newRow: RowData = { id: generate_uuid() };
    schema.forEach(field => {
      newRow[field.key] = field.type === "checkbox" ? false : "";
    });
    setFormData((prev: any) => {
      const existingRows = prev[stepId].rows || [];
      return {
        ...prev,
        [stepId]: { ...prev[stepId], rows: [...existingRows, newRow] } // Ensure other step data is preserved
      };
    });
  };

  // Render a cell based on its field type
  const renderCell = (row: RowData, field: SchemaField) => {
    const value = row[field.key];

    // Determine if the specific cell should be editable
    // It's editable if canEditGridText is true AND the grid itself isn't disabled from outside
    const isCellEditable = canEditGridText && !disabled;

    if (!isCellEditable) {
      return <span>{value}</span>;
    }

    switch (field.type) {
      case "text":
        return (
          <Form.Control
            type="text"
            value={value}
            disabled={!isCellEditable} // Disabled if not editable or globally disabled
            onChange={e =>
              updateCell(row.id, field.key, e.target.value)
            }
          />
        );
      case "select":
        return (
          <Form.Select
            value={value}
            disabled={!isCellEditable} // Disabled if not editable or globally disabled
            onChange={e =>
              updateCell(row.id, field.key, e.target.value)
            }
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Form.Select>
        );
      case "checkbox":
        return (
          <Form.Check
            type="checkbox"
            disabled={!isCellEditable} // Disabled if not editable or globally disabled
            checked={!!value}
            onChange={e =>
              updateCell(row.id, field.key, e.target.checked)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Table bordered hover={!disabled} responsive>
        <thead>
          <tr>
            {/* Render column headers */}
            {schema.map(field => (
              <th style={{ minWidth: "100px" }} key={field.key}>{field.label}</th>
            ))}
            {/* Render Actions column header only if canDeleteRow is true */}
            {canDeleteRow && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {/* Render rows */}
          {rows.map((row: any) => (
            <tr key={row.id}>
              {schema.map(field => {
                // Render editable cells based on canEditGridText
                return (<td key={field.key}>{renderCell(row, field)}</td>)
              })}
              {/* Render delete button only if canDeleteRow is true */}
              {canDeleteRow && (
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!canDeleteRow || disabled} // Button is disabled if canDeleteRow is false OR globally disabled
                    onClick={() => deleteRow(row.id)}
                  >
                    Delete
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Render add row button only if canAddRow is true */}
      {canAddRow && (
        <Button variant="secondary" onClick={addRow} disabled={!canAddRow || disabled} className="mb-3">
          + Add
        </Button>
      )}
    </>
  );
};