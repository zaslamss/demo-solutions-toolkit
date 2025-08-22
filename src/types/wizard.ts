// --- API & Actions ---

export interface ApiCall {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface Condition {
  key: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isLessThan' | 'isGreaterThan' | 'exists' | 'notExists';
  value?: any;
}

export interface OnSuccessRule {
  condition: Condition | null;
  then: { goToStep: string; };
}

interface BaseAction {
  actionId: string;
  label: string;
}

export interface WorkerAction extends BaseAction {
  type: 'worker';
  backend: {
    workerFunctionName: string;
    inputSource: 'formData' | string;
    outputKey: string;
  };
  onSuccess: OnSuccessRule[];
}

export interface NavigationAction extends BaseAction {
  type: 'navigation';
  onSuccess: { goToStep: string; };
}

export type Action = (WorkerAction | NavigationAction) & { displayCondition?: Condition };

// --- Form Fields ---

export type FormData = Record<string, any>;

export type FormFieldType = 'text' | 'select' | 'textarea' | 'file' | 'grid' | 'number';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  editable?: boolean;
  attributes?: Record<string, any>;
  options?: { value: string; label: string }[];
  displayCondition?: Condition;
  sourceDataKey?: string;
  sourceDataPath?: string;
}

// --- Step Definitions ---

export type StepType = 'form' | 'success' | 'error';

export interface BaseStep {
  stepId: string;
  title: string;
  content?: string;
}

export interface FormStep extends BaseStep {
  type: 'form';
  dataSource?: {
    apiCall: ApiCall;
    mapping: Record<string, string>;
  };
  fields: FormField[];
  actions: Action[];
}

export interface SuccessStep extends BaseStep {
  type: 'success';
}

export interface ErrorStep extends BaseStep {
  type: 'error';
}

export type WizardStep = FormStep | SuccessStep | ErrorStep;

// --- Main Tool Definition ---

export interface ToolDefinition {
  id:string;
  name: string;
  description: string;
  steps: WizardStep[];
}
