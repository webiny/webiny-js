import { createAbstraction } from "@webiny/feature/admin";

/**
 * A tool the assistant can call that runs here, in the browser, against the screen the user is on.
 * The page editor offers "add these elements to the page": the page lives in the editor until the
 * user saves it, so no server tool can change it.
 *
 * The server offers it to the model with each question. A call to it pauses the run; the assistant
 * presenter runs `execute` and sends the result back, and the run continues.
 */
export interface AssistantClientTool {
    /** Letters, digits and underscores, starting with a letter. Never a server tool's name. */
    name: string;
    /** What the tool does and when to use it, written for the model. */
    description: string;
    /** JSON Schema of the input, `type: "object"`. */
    inputSchema: Record<string, unknown>;
    /**
     * Run the call. Return what the model should know about the outcome, small and JSON-safe. Throw
     * to fail it: the model reads the message and usually corrects its call.
     */
    execute(input: unknown): Promise<unknown>;
}

/** A call the assistant made to one of these tools. */
export interface AssistantClientToolCall {
    toolCallId: string;
    toolName: string;
    input: unknown;
}

/** What a call came to: the tool's output, or why it failed. */
export interface AssistantClientToolResult {
    toolCallId: string;
    toolName: string;
    output?: unknown;
    error?: string;
}

/** Identifies one `register`, so each screen removes only the tools it added. */
export type AssistantClientToolsOwner = symbol;

export interface IAssistantClientTools {
    /** Offer these tools until `unregister` is called with the returned owner. */
    register(tools: AssistantClientTool[]): AssistantClientToolsOwner;
    unregister(owner: AssistantClientToolsOwner): void;
    /** Every tool offered now. A newer registration wins a name both use. */
    list(): AssistantClientTool[];
    /**
     * Run one call with the tool of that name among `offered`, the tools the request that led to it
     * offered. Never throws: a tool that throws, or one no longer registered because its screen was
     * left, comes back as a result with `error`, which the model reads. A tool of the same name from
     * a screen opened since is never run in its place.
     */
    run(
        call: AssistantClientToolCall,
        offered: AssistantClientTool[]
    ): Promise<AssistantClientToolResult>;
}

/**
 * The tools the screen the user is on runs for the assistant. A screen registers them when it
 * mounts and unregisters them when it goes, so a question asked anywhere else is offered none.
 */
export const AssistantClientTools =
    createAbstraction<IAssistantClientTools>("AssistantClientTools");

export namespace AssistantClientTools {
    export type Interface = IAssistantClientTools;
    export type Tool = AssistantClientTool;
    export type Owner = AssistantClientToolsOwner;
    export type Call = AssistantClientToolCall;
    export type Result = AssistantClientToolResult;
}
