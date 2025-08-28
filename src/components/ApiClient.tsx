import { ToolDefinition } from '../types';

// TODO: Move this to environment variables
const API_BASE_URL = 'https://devapi.mbfcorp.tools';

interface StartRunResponse {
  runId: string;
}

export interface RunResponse {
  runId: string;
  toolId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  currentStepId: string;
  formData: Record<string, any>;
  runData: Record<string, any>;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  toolDefinition: ToolDefinition;
  log: any[];
  
  jobHistory?: Record<string, {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    actionId: string;
    outputKey?: string;
    error?: string;
  }>;
}
export const apiClient = {
  /**
   * Fetches a tool's definition.
   * Corresponds to the `toolkit-get-tool-definition` Lambda.
   * @param toolId - The ID of the tool to fetch.
   */
  getToolDefinition: async (toolId: string): Promise<ToolDefinition> => {
    const response = await fetch(`${API_BASE_URL}/tools/${toolId}`, {
      credentials: "include"
    });
    if (!response.ok) {
      console.error("API Error fetching tool definition:", await response.text());
      throw new Error(`Failed to fetch tool definition: ${response.statusText}`);
    }
    return await response.json();
  },

  /**
   * Creates a new run record in the database on the user's first action.
   * Corresponds to the `toolkit-workflow-initializer` Lambda.
   * @param toolId - The ID of the tool being run.
   * @param toolDefinition - The full definition object.
   * @param formData - The form data from the first step.
   */
  startRun: async (toolId: string, toolDefinition: ToolDefinition, formData: any): Promise<StartRunResponse> => {
    const response = await fetch(`${API_BASE_URL}/runs`, {
      method: 'POST',
      credentials: "include",
      body: JSON.stringify({ toolId, toolDefinition, formData })
    });
    if (!response.ok) {
      console.error("API Error starting run:", await response.text());
      throw new Error(`Failed to start run: ${response.statusText}`);
    }
    return await response.json();
  },

  /**
   * Saves the state for a navigation action.
   * Corresponds to the `toolkit-workflow-state` Lambda.
   * @param runId - The active run's ID.
   * @param payload - The data to save (new step ID and current form data).
   */
  put: async (endpoint: string, payload: any): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: "include",
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error("API Error on PUT:", await response.text());
      throw new Error(`API PUT request failed: ${response.statusText}`);
    }
    return { success: true };
  },

  /**
   * Invokes the orchestrator which fires off each worker action.
   * @param endpoint - The full path for the action, including the runId.
   * @param payload - The data needed by the orchestrator.
   */
  post: async (endpoint: string, payload: any): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error("API Error on POST:", await response.text());
      throw new Error(`API POST request failed: ${response.statusText}`);
    }
    return await response.json();
  },

  /**
   * Polls for the status of an entire run by fetching the Run object.
   * @param runId - The ID of the run to fetch.
   */
  getRun: async (runId: string): Promise<RunResponse> => {
    const response = await fetch(`${API_BASE_URL}/runs/${runId}`, {
      credentials: "include"
    });
    if (!response.ok) {
      console.error("API Error fetching run status:", await response.text());
      throw new Error(`Failed to fetch run status: ${response.statusText}`);
    }
    return await response.json();
  }
};