import { jsonSchema, tool } from "ai";
import type { JSONSchema7, ModelMessage, ToolSet } from "ai";

/**
 * A tool the admin screen the user is on runs itself, in the browser. The page editor offers
 * "add these elements to the page": the page lives in the editor until the user saves it, so no
 * server tool can change it.
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

const MAX_TOOLS = 20;
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
/**
 * A screen's tools, descriptions and schemas together. The page editor's are about 6000 characters;
 * the rest is room for a component catalog in a description.
 */
const MAX_DECLARATIONS_LENGTH = 64_000;
/** One result. An editor reports what it changed, not the page. */
const MAX_RESULT_LENGTH = 32_000;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Reads the client tools from a request body. Malformed entries are dropped one by one; a set too
 * big to send to a model is dropped whole, and the question is answered without them.
 */
export const parseClientTools = (value: unknown): ClientToolDeclaration[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    const declarations: ClientToolDeclaration[] = [];
    const names = new Set<string>();

    for (const entry of value.slice(0, MAX_TOOLS)) {
        if (!isRecord(entry)) {
            continue;
        }
        const { name, description, inputSchema } = entry;
        if (typeof name !== "string" || !NAME_PATTERN.test(name) || names.has(name)) {
            continue;
        }
        if (typeof description !== "string" || !description.trim()) {
            continue;
        }
        if (!isRecord(inputSchema) || inputSchema["type"] !== "object") {
            continue;
        }
        names.add(name);
        declarations.push({ name, description, inputSchema });
    }

    if (JSON.stringify(declarations).length > MAX_DECLARATIONS_LENGTH) {
        return [];
    }

    return declarations;
};

export const parseToolResults = (value: unknown): ClientToolResult[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap(entry => {
        if (!isRecord(entry)) {
            return [];
        }
        const { toolCallId, toolName, output, error } = entry;
        if (typeof toolCallId !== "string" || typeof toolName !== "string") {
            return [];
        }

        const result: ClientToolResult = { toolCallId, toolName };
        if (typeof error === "string" && error) {
            result.error = error;
            return [result];
        }

        const serialized = JSON.stringify(output ?? null);
        if (serialized.length > MAX_RESULT_LENGTH) {
            result.error = "The result was too large to send back.";
            return [result];
        }
        result.output = output ?? null;
        return [result];
    });
};

/**
 * The client tools as the model is offered them. No `execute`: the SDK ends the run on a call to
 * one, and leaves it to the caller to supply the result.
 */
export const toClientToolSet = (declarations: ClientToolDeclaration[]): ToolSet => {
    const tools: ToolSet = {};
    for (const declaration of declarations) {
        tools[declaration.name] = tool({
            description: declaration.description,
            inputSchema: jsonSchema(declaration.inputSchema as JSONSchema7)
        });
    }
    return tools;
};

/** The browser's results, as the tool message that answers the calls. */
export const toResultMessage = (results: ClientToolResult[]): ModelMessage => {
    return {
        role: "tool",
        content: results.map(result => {
            if (result.error) {
                return {
                    type: "tool-result" as const,
                    toolCallId: result.toolCallId,
                    toolName: result.toolName,
                    output: { type: "error-text" as const, value: result.error }
                };
            }
            return {
                type: "tool-result" as const,
                toolCallId: result.toolCallId,
                toolName: result.toolName,
                output: {
                    type: "json" as const,
                    value: (result.output ?? null) as never
                }
            };
        })
    };
};

interface Part {
    type?: unknown;
    toolCallId?: unknown;
    toolName?: unknown;
}

const partsOf = (message: ModelMessage): Part[] => {
    return Array.isArray(message.content) ? (message.content as Part[]) : [];
};

/**
 * Tool calls in a saved chat that nothing answers yet, in the order they were made: the calls the
 * browser was asked to run. A call that waits for approval has no result either, but it is answered
 * by the decision, so it is left out.
 */
export const unansweredClientCalls = (
    messages: ModelMessage[]
): { toolCallId: string; toolName: string }[] => {
    const calls: { toolCallId: string; toolName: string }[] = [];
    const answered = new Set<string>();

    for (const message of messages) {
        for (const part of partsOf(message)) {
            if (typeof part.toolCallId !== "string") {
                continue;
            }
            if (part.type === "tool-call" && typeof part.toolName === "string") {
                calls.push({ toolCallId: part.toolCallId, toolName: part.toolName });
            }
            if (part.type === "tool-result" || part.type === "tool-approval-request") {
                answered.add(part.toolCallId);
            }
        }
    }

    return calls.filter(call => !answered.has(call.toolCallId));
};

/**
 * Whether the results answer every call still waiting, once each, and nothing else. A result for an
 * older call, or one missing, would hand the model a history the provider refuses.
 */
export const answersExactly = (
    results: ClientToolResult[],
    waiting: { toolCallId: string }[]
): boolean => {
    const answered = new Set(results.map(result => result.toolCallId));
    if (answered.size !== results.length || answered.size !== waiting.length) {
        return false;
    }
    return waiting.every(call => answered.has(call.toolCallId));
};
