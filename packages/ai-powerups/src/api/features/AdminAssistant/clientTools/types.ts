/**
 * A tool the admin screen the user is on runs itself, in the browser. The page editor offers
 * "add these elements to the page": the editor holds the page and saves its draft on every change,
 * so a server tool's change would not show in the open editor and its next save would overwrite it.
 *
 * Declared by the screen with each request. The server offers it to the model with no `execute`, so
 * a call to it ends the run the same way an approval does, and the browser's result resumes it.
 */
export interface ClientToolDeclaration {
    name: string;
    description: string;
    /** JSON Schema of the input. */
    inputSchema: Record<string, unknown>;
}

/** A call to a client tool, sent to the browser to run. */
export interface ClientToolCall {
    toolCallId: string;
    toolName: string;
    input: unknown;
}

/** What the browser reports back for one call. */
export interface ClientToolResult {
    toolCallId: string;
    toolName: string;
    /** The tool's output. Ignored when `error` is set. */
    output?: unknown;
    /** Why the call failed. The model reads it and usually corrects its call. */
    error?: string;
}
