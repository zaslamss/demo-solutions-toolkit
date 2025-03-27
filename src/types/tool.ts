export interface ToolSummaryProps {
    name: string;
    summary: string;
    id: string;
    slug: string;
    public: boolean
}

export interface ToolDescriptionProps {
    heading: string;
    type: "text" | "ordered" | "unordered";
    content: string[];
}