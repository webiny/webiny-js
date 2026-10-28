import { z } from "zod";
import { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";

export interface RecordedToolCall {
    input: unknown;
    context: WorkflowAiTool.Context;
}

/**
 * A `WorkflowAiTool` that records every call with the context it got and answers `result`, or
 * throws `failure` when set. It writes nothing; a test that counts `calls` counts the writes a
 * stale call must not make.
 */
export class RecordingAiTool implements WorkflowAiTool.Interface {
    public readonly title: string;
    public readonly description = "Echoes its value.";
    public readonly label = "Echo";
    public readonly summary = "Echoes its value.";
    public readonly inputSchema = z.object({ value: z.string() });
    public readonly calls: RecordedToolCall[] = [];
    public result: WorkflowAiTool.Result = { ok: true, data: { echoed: true } };
    public failure: Error | null = null;

    public constructor(public readonly name: string) {
        this.title = name;
    }

    public async execute(input: unknown, context: WorkflowAiTool.Context) {
        this.calls.push({ input, context });
        if (this.failure) {
            throw this.failure;
        }
        return this.result;
    }
}
