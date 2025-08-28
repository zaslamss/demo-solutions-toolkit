
import { Condition, FormData } from '../types';

/**
 * Evaluates a display condition against the current form data.
 * @param condition The condition object from the JSON schema.
 * @param formData The current state of the form.
 * @returns {boolean} - True if the element should be displayed, false otherwise.
 */
export const checkDisplayCondition = (condition: Condition | undefined, formData: FormData): boolean => {
  // If no condition is provided, always display the element.
  if (!condition) {
    return true;
  }

  const { key, operator, value } = condition;
  const formDataValue = formData[key];

  switch (operator) {
    case 'equals':
      return formDataValue === value;
    case 'notEquals':
      return formDataValue !== value;
    case 'exists':
      return formDataValue !== null && formDataValue !== undefined;
    case 'notExists':
      return formDataValue === null || formDataValue === undefined;
    default:
      return false;
  }
};