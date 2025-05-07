import { Table, Form } from "react-bootstrap";

type GridProps = {
  gridData: {
    headers: string[];
    rows: { id: string; type: string; value?: string; options?: { value: string; label: string }[] }[][];
  };
  stepId: string;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  disabled?: boolean;
};

export const EditableGrid = ({ gridData, stepId, formData, setFormData, disabled }: GridProps) => {
  const handleChange = (rowIdx: number, fieldId: string, value: any) => {
    setFormData((prev: any) => {
      const existing = prev[stepId]?.rows || [];
      const updatedRows = [...existing];
      if (!updatedRows[rowIdx]) updatedRows[rowIdx] = {};
      updatedRows[rowIdx][fieldId] = value;

      return {
        ...prev,
        [stepId]: { rows: updatedRows }
      };
    });
  };

  return (
    <Table bordered responsive>
      <thead>
        <tr>
          {gridData.headers.map((header, idx) => (
            <th key={idx}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {gridData.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((field) => {
              const value = formData[stepId]?.rows?.[rowIndex]?.[field.id] ?? field.value ?? "";

              if (field.type === "input") {
                return (
                  <td key={field.id}>
                    <Form.Control
                      type="text"
                      value={value}
                      disabled={disabled}
                      onChange={(e) => handleChange(rowIndex, field.id, e.target.value)}
                    />
                  </td>
                );
              }

              if (field.type === "select") {
                return (
                  <td key={field.id}>
                    <Form.Select
                      value={value}
                      disabled={disabled}
                      onChange={(e) => handleChange(rowIndex, field.id, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                );
              }
              return <td key={field.id}></td>;
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
