export interface Option {
    value: string;
    label: string;
}

export interface ToolSummaryProps {
    name: string;
    summary: string;
    id: string;
    slug: string;
    public: boolean;
}

export interface ToolDescriptionProps {
    heading: string;
    type: "text" | "ordered" | "unordered";
    content: string[];
}

export interface ToolFieldProps {
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
    reset?: string[];
    conditionalOptions?: {
        dependsOn: string;
        condition: "answered" | "eq";
        value?: string;
        options: Record<string, Option[]>;
    };
    conditionalValues?: {
        dependsOn: string;
        condition: "answered" | "eq";
        value?: string;
        values: Record<string, string>;
    };
    fetchOptions?: {
        endpoint: string;
        params: Record<string, string>;
    };
    prefill?: Record<string, any>;
    layout?: {
        col?: number;
        rowGroup?: string;
    };
}

export interface Run {
    id: string;
    name: string;
    userId?: string;
    log: {
        level: string;
        message: string;
    }[],
    progressTotal: number;
    progressCompleted: number;
    status: "STARTED" | "PENDING" | "IN PROGRESS" | "SUCCESS" | "FAILED";
}


export interface ToolProps {
    name: string;
    summary: string;
    description: ToolDescriptionProps[];
    form: ToolFieldProps[];
    runs?: Run[];
}


export interface OnSubmitAction {
    action: string;
    prompt?: true;
    apiEndpoint?: string;
    promptContext?: string;
    method?: string;
    inputMapping?: Record<string, any>;
    storeResponseAs?: string;
    condition?: {
        when: string;
        equals: string;
    };
    storeDataAs?: string;
    dataToStore?: any;
}

export interface EditCondition {
    when: string;
    equals: string;
}

export interface EditFeatures {
    addRow?: {
        "enabled": boolean;
        "condition"?: EditCondition
    };
    deleteRow?: {
        "enabled": boolean;
        "condition"?: EditCondition;
    };
    gridText?: {
        "enabled": boolean;
        "condition"?: EditCondition
    };
}

// Represents the configuration for polling the workflow status
export interface PollingConfig {
  apiEndpoint: string;
  method: "GET" | "POST";
  interval: number; // Polling interval in milliseconds
  successStatus: string; // The status string that indicates success
  failureStatus: string; // The status string that indicates failure
}

export interface Step {
    id: string;
    title: string;
    description: string;
    type: "form" | "prompt" | "grid";
    nextStepId?: string;
    editable?: boolean; // property for grid
    editFeatures?: EditFeatures;
    fields?: { // property for form
        id: string;
        type: string;
        label: string;
        required?: boolean;
        dependsOn?: {
            fieldId: string;
            optionsMap: Record<string, { value: string; label: string }[]>;
        };
        options?: { value: string; label: string }[];
    }[];
    dataSource?: string;
    onSubmit?: OnSubmitAction;
    polling?: PollingConfig;
}


export interface StepMessage {
    level: "INFO" | "WARNING" | "ERROR";
    message: string;
}