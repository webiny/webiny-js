import {
    AiOutputToolRegistry,
    AiToolPipelineRunner as Abstraction,
    type IAiOutputToolRegistry,
    type IAiToolPipelineRunner
} from "./abstractions.js";

function isToolEnvelope(
    value: unknown
): value is { tool: string; params: Record<string, unknown> } {
    return (
        typeof value === "object" &&
        value !== null &&
        "tool" in value &&
        typeof (value as Record<string, unknown>).tool === "string" &&
        "params" in value &&
        typeof (value as Record<string, unknown>).params === "object"
    );
}

class AiToolPipelineRunnerImpl implements IAiToolPipelineRunner {
    constructor(private registry: IAiOutputToolRegistry) {}

    async resolve(data: unknown): Promise<unknown> {
        if (data === null || data === undefined) {
            return data;
        }

        if (isToolEnvelope(data)) {
            if (!this.registry.has(data.tool)) {
                return data;
            }
            const result = await this.registry.invoke(data.tool, data.params);
            return this.resolve(result);
        }

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => this.resolve(item)));
        }

        if (typeof data === "object") {
            const entries = Object.entries(data as Record<string, unknown>);
            const resolvedValues = await Promise.all(
                entries.map(([, value]) => this.resolve(value))
            );
            return Object.fromEntries(entries.map(([key], i) => [key, resolvedValues[i]]));
        }

        return data;
    }
}

export const AiToolPipelineRunner = Abstraction.createImplementation({
    implementation: AiToolPipelineRunnerImpl,
    dependencies: [AiOutputToolRegistry]
});
