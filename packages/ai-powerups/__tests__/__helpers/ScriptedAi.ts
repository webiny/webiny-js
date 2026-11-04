import { NoOutputGeneratedError } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";

export interface ScriptedToolCall {
    name: string;
    input: unknown;
}

export interface ScriptedStep {
    /** Runs before the step's tool calls: flip the stored review, move the clock, abort. */
    before?: () => Promise<void> | void;
    toolCalls: ScriptedToolCall[];
    /** Thrown after the step's tool calls and before the stop conditions: a provider failure. */
    fail?: Error;
}

export interface ScriptedResponse {
    steps: ScriptedStep[];
    /** What `result.output` answers; `null` makes the getter throw `NoOutputGeneratedError`. */
    decision: unknown;
    /** Thrown after all steps ran, instead of answering. */
    error?: Error;
}

export interface RecordedToolResult {
    name: string;
    input: unknown;
    result: unknown;
}

interface ExecutedStep {
    toolCalls: ScriptedToolCall[];
}

type ToolExecute = (input: unknown, options: unknown) => Promise<unknown>;

export const APPROVE_DECISION = { approved: true, comment: "", issues: [] };

/** An error shaped like the one the AI SDK throws when the abort signal fires. */
const createAbortError = (): Error => {
    return Object.assign(new Error("This operation was aborted."), { name: "AbortError" });
};

/**
 * An `Ai` that never calls a model. `calls` records every `generateText` parameter set,
 * `toolResults` every tool result the "model" got back. `listModels` answers `models`; nothing
 * else of `Ai` is used by the code under test, so the rest throws.
 */
export class ScriptedAi implements Ai.Interface {
    public readonly calls: Ai.GenerateTextParams[] = [];
    public readonly toolResults: RecordedToolResult[] = [];
    public models: AiModel[] = [];
    public response: ScriptedResponse = { steps: [], decision: APPROVE_DECISION };

    public async generateText(
        params: Ai.GenerateTextParams
    ): ReturnType<Ai.Interface["generateText"]> {
        this.calls.push(params);
        const executed: ExecutedStep[] = [];

        for (const step of this.response.steps) {
            if (params.abortSignal?.aborted) {
                throw createAbortError();
            }
            await step.before?.();
            if (params.abortSignal?.aborted) {
                throw createAbortError();
            }
            // Like the SDK: the tool calls of one step run in parallel; results keep call order.
            const outcomes = await Promise.all(
                step.toolCalls.map(async (call, index) => {
                    const execute = params.tools?.[call.name]?.execute as unknown as
                        | ToolExecute
                        | undefined;
                    const result = execute
                        ? await execute(call.input, { toolCallId: `call-${index}`, messages: [] })
                        : { ok: false, error: `No such tool: ${call.name}` };
                    return { name: call.name, input: call.input, result };
                })
            );
            this.toolResults.push(...outcomes);
            executed.push({ toolCalls: step.toolCalls });
            if (step.fail) {
                throw step.fail;
            }
            // Like the SDK: only a step with tool calls asks the stop conditions whether to go on.
            if (step.toolCalls.length > 0) {
                const conditions = Array.isArray(params.stopWhen)
                    ? params.stopWhen
                    : params.stopWhen
                      ? [params.stopWhen]
                      : [];
                let stop = false;
                for (const condition of conditions) {
                    if (await condition({ steps: executed as never })) {
                        stop = true;
                    }
                }
                if (stop) {
                    return this.createResult(executed, null);
                }
            }
        }

        if (this.response.error) {
            throw this.response.error;
        }
        // The decision is the last model step: it has no tool calls.
        executed.push({ toolCalls: [] });
        return this.createResult(executed, this.response.decision);
    }

    private createResult(
        steps: ExecutedStep[],
        decision: unknown
    ): Awaited<ReturnType<Ai.Interface["generateText"]>> {
        const result = {
            steps,
            text: "",
            get output() {
                if (decision === null) {
                    throw new NoOutputGeneratedError();
                }
                return decision;
            }
        };
        return result as unknown as Awaited<ReturnType<Ai.Interface["generateText"]>>;
    }

    public async streamText(): Promise<never> {
        throw new Error("The scripted Ai does not stream text.");
    }

    public async listModels(): Promise<AiModel[]> {
        return this.models;
    }

    public async listModelsByConnections(): Promise<AiModel[]> {
        throw new Error("listModelsByConnections must not be used (R169).");
    }

    public async listModelsByConnection(): Promise<AiModel[]> {
        throw new Error("listModelsByConnection must not be used (R169).");
    }
}
