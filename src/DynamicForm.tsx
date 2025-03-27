import { Button, FormLabel, SelectV2, TextInput } from "@smartsheet/lodestar-core";
import React, { useEffect, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface Field {
  id: string;
  label: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: Option[];
  visibility?: {
    dependsOn: string;
    value?: string;
    condition: "answered" | "eq";
  };
  conditionalOptions?: {
    dependsOn: string;
    condition: "answered" | "eq";
    value?: string;
    options: Record<string, Option[]>;
  }
  conditionalValues?: {
    dependsOn: string;
    condition: "answered" | "eq";
    value?: string;
    values: Record<string, string>;
  }
  fetchOptions?: {
    endpoint: string;
    params: Record<string, string>;
  };
  prefill?: Record<string, any>;
}

interface DynamicFormProps {
  fields: Field[];
}


const DynamicForm: React.FC<DynamicFormProps> = ({ fields }) => {
  // const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, Option[]>>({});

  useEffect(() => {
    // Fetch the template
    // setFormTemplate(dc_template);

    // Set initial form data
    const initialData: Record<string, any> = {};
    fields.forEach((field) => {
      initialData[field.id] = "";
    });
    setFormData(initialData);
  }, []);

  // Function to reset the form data for dependent fields recursively
  const resetDependentFields = (parentFieldId: string) => {
    fields.forEach((field) => {
      // Check if the field is dependent on the parent field
      if (
        field.visibility?.dependsOn === parentFieldId ||
        field.conditionalValues?.dependsOn === parentFieldId ||
        field.conditionalOptions?.dependsOn === parentFieldId
      ) {
        // Reset the value and visibility of the dependent field
        setFormData((prev) => ({ ...prev, [field.id]: "" }));
        setDropdownOptions((prev) => ({
          ...prev,
          [field.id]: [],
        }));
        // Recursively reset nested dependencies
        resetDependentFields(field.id);
      }
    });
  };

  // Function to determine visibility based on conditional logic
  const isFieldVisible = (field: Field): boolean => {
    if (field.visibility) {
      const { dependsOn, condition } = field.visibility;
      const parentValue = formData[dependsOn];
      return (
        (condition === "eq" && parentValue === field.visibility.value) ||
        (condition === "answered" && parentValue !== "")
      );
    }
    return true;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    // Update form data
    setFormData((prev) => ({ ...prev, [fieldId]: value }));

    // Handle conditional dropdown logic
    fields.forEach((field) => {
      if (
        field.conditionalOptions &&
        field.conditionalOptions.dependsOn === fieldId &&
        field.conditionalOptions.condition === "answered"
      ) {
        setDropdownOptions((prev) => ({
          ...prev,
          [field.id]: field.conditionalOptions?.options[value.value] || [],
        }));
        setFormData((prev) => ({ ...prev, [field.id]: "" }));
      }
    });

    // Pre-fill answers based on the selected value        
    fields.forEach((field) => {
      if (
        field.conditionalValues &&
        field.conditionalValues.dependsOn == fieldId &&
        field.conditionalValues.condition === "answered"
      ) {
        setFormData((prev) => ({
          ...prev,
          [field.id]: field.conditionalValues?.values[value.value],
        }));
      }
    });

    // After updating the parent field, reset dependent fields (both visibility and values)
    resetDependentFields(fieldId);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log(JSON.stringify(formData));
  };

  const optionKey: any = (option: any) => option.label;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => {
          const isVisible = isFieldVisible(field);

          if (!isVisible) return null;

          return (
            <div key={field.id}>
              {field.type === "text" || field.type === "number" ? (
                <FormLabel key={field.id} label={field.label} description={field.description}>
                  {(labelProps) => (
                    <TextInput
                      {...labelProps}
                      onChange={(value) => handleInputChange(field.id, value)}
                      value={formData[field.id] || ""}
                      required={field.required}
                    />
                  )}
                </FormLabel>
              ) : field.type === "dropdown" ? (
                <FormLabel key={field.id} label={field.label} description={field.description}>
                  {(labelProps) => (
                    <SelectV2
                      isSearchable
                      options={dropdownOptions?.[field.id] || field.options || []}
                      selectedOption={formData?.[field.id] || { label: "", value: "" }}
                      menuWidth="match-control"
                      locale="en"
                      onChange={(value) => handleInputChange(field.id, value)}
                      getOptionKey={optionKey}
                      {...labelProps}
                    />
                  )}
                </FormLabel>
              ) : null}
            </div>
          );
        })}
        <Button shouldFitContainer={true} type="submit">
          Run
        </Button>
      </form>
    </div>
  );
};

export default DynamicForm;
