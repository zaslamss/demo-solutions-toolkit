import { useState } from "react";
import { Table, Form, Button } from "react-bootstrap";

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
  editable?: boolean;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  disabled?: boolean;
};

export const Grid = ({ gridData, stepId, formData, editable, setFormData, disabled }: GridProps) => {
  // Initialize schema and rows from gridData
  const [schema] = useState<SchemaField[]>(gridData.schema || []);
  const rows = formData[stepId]?.rows || [];

  // Function to update a cell in the grid
  const updateCell = (id: string, key: string, value: any) => {
    setFormData((prev: any) => {
      // Find the existing rows for the current step
      const existingRows = prev[stepId].rows || [];
      // Update the specific row with the new value
      const updatedRows = existingRows.map((row: any) => {
        if (row.id === id) {
          return { ...row, [key]: value };
        }
        return row;
      });
      // Return the updated form data with the modified rows
      return {
        ...prev,
        [stepId]: { rows: updatedRows }
      };
    }
    );
  };

  // Function to delete a row from the grid
  const deleteRow = (id: string) => {
    setFormData((prev: any) => {
      // Filter out the row with the specified id
      const existingRows = prev[stepId].rows || [];
      const updatedRows = existingRows.filter((row: any) => row.id !== id);
      // Return the updated form data with the remaining rows
      return {
        ...prev,
        [stepId]: { rows: updatedRows }
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
    // Create a new row with default values based on the schema
    const newRow: RowData = { id: generate_uuid() };
    schema.forEach(field => {
      newRow[field.key] = field.type === "checkbox" ? false : "";
    });
    setFormData((prev: any) => {
      // Add the new row to the existing rows for the current step
      // If there are no existing rows, initialize with an empty array
      const existingRows = prev[stepId].rows || [];
      // Return the updated form data with the new row added
      return {
        ...prev,
        [stepId]: { rows: [...existingRows, newRow] }
      };
    }
    );
  };

  // Render a cell based on its field type
  const renderCell = (row: RowData, field: SchemaField) => {
    const value = row[field.key];

    switch (field.type) {
      case "text":
        return (
          <Form.Control
            type="text"
            value={value}
            disabled={disabled}
            onChange={e =>
              updateCell(row.id, field.key, e.target.value)
            }
          />
        );
      case "select":
        return (
          <Form.Select
            value={value}
            disabled={disabled}
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
            disabled={disabled}
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
            {/* Render actions column if editable */}
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {/* Render rows */}
          {rows.map((row: any) => (
            <tr key={row.id}>
              {schema.map(field => {
                if (editable) {
                  // Render editable cell based on field type
                  return (<td key={field.key}>{renderCell(row, field)}</td>)
                } else {
                  // Render static cell for non-editable grid
                  return (
                    <td key={field.key}>{row[field.key]}</td>
                  )
                }
              })}
              {/* Render delete button if editable */}
              {editable && (
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={disabled}
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
      {/* Render add row button if editable */}
      {editable && (
        <Button variant="secondary" onClick={addRow} disabled={disabled} className="mb-3">
          + Add
        </Button>
      )}
    </>
  );
};


