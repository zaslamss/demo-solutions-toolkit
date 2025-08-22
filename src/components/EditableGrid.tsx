import { Button, Form, Table } from 'react-bootstrap';
import { useTool } from './ToolContext';
import { XCircleFill } from 'react-bootstrap-icons';

interface EditableGridProps {
  fieldId: string;
  schema: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
  }>;
  rows: Array<Record<string, any>>;
  editable?: boolean;
}

const EditableGrid = ({ fieldId, schema, rows, editable = true }: EditableGridProps) => {
  const { updateFormField } = useTool();

  const handleRemoveRow = (rowIndexToRemove: number) => {
    const updatedRows = rows.filter((_, index) => index !== rowIndexToRemove);
    
    updateFormField(fieldId, updatedRows);
  };

  const handleAddRow = () => {
    const newRow = schema.reduce((acc, col) => {
      if (col.type === 'select' && col.options && col.options.length > 0) {
        acc[col.key] = col.options[0];
      } else {
        acc[col.key] = '';
      }
      return acc;
    }, {} as Record<string, any>);
    newRow.id = `new-${Date.now()}`;

    const updatedRows = [...rows, newRow];
    updateFormField(fieldId, updatedRows);
  };

  const handleCellChange = (rowIndex: number, columnKey: string, newValue: any) => {
    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        return { ...row, [columnKey]: newValue };
      }
      return row;
    });

    updateFormField(fieldId, updatedRows);
  };

  return (
    <>
    <Table striped={!editable} bordered hover responsive>
      <thead>
        <tr>
          {schema.map(col => <th key={col.key}>{col.label}</th>)}
          {editable && <th style={{ width: '50px' }}></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id ?? rowIndex}>
            {schema.map(col => (
              <td key={`${row.id ?? rowIndex}-${col.key}`}>
                {!editable ? (
                  <span>{String(row[col.key])}</span>
                ) : col.type === 'select' ? (
                  <Form.Select
                    value={row[col.key] || ''}
                    onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                  >
                    {col.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    type="text"
                    value={row[col.key] || ''}
                    onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                  />
                )}
              </td>
            ))}
            {editable && (
                <td className="">
                  <Button
                    className="btn-icon-minimal"
                    variant="outline-danger"
                    onClick={() => handleRemoveRow(rowIndex)}
                  >
                    <XCircleFill size={25} />
                  </Button>
                </td>
              )}
          </tr>
        ))}
      </tbody>
    </Table>
    {editable && (
        <div className="d-flex justify-content-start mt-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleAddRow}
          >
            + Add Row
          </Button>
        </div>
      )}
    </>
  );
};

export default EditableGrid;