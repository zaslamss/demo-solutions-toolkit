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


export interface Step {
    id: string;
    title: string;
    description: string;
    type: "form" | "prompt" | "grid";
    nextStepId?: string;
    editable?: boolean; // property for grid
    fields?: { // property for form
      id: string;
      type: string;
      label: string;
      required?: boolean;
      options?: { value: string; label: string }[];
    }[];
    dataSource?: string;
    onSubmit?: {
      action: string;
      apiEndpoint?: string;
      promptContext?: string;
      method?: string;
      inputMapping?: Record<string, any>;
      storeResponseAs?: string;
    };
  }