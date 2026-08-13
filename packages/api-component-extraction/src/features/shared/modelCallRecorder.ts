import {
    AiAfterGenerateTextEventHandler,
    AiGenerateTextErrorEventHandler
} from "@webiny/api-core/features/ai/index.js";
import { ModelCallRepository } from "~/domain/abstractions.js";
import type { Stage } from "~/constants.js";
import { ModelCallScope } from "./modelCallScope.js";

/**
 * Records every model call made during an extraction stage against the run, by subscribing to the core
 * `Ai` events. One subscriber covers Classify, Plan and Generate — the single point every model call
 * funnels through. It attributes the call via the `ModelCallScope` the runner set up the stack; a call
 * made outside any stage (audit logs, other features) has no scope and is ignored.
 *
 * Both handlers are strictly best-effort: `EventPublisher.publish` awaits them inside the `Ai` call, so
 * a throw here would fail the model call itself. Every path is wrapped and swallowed.
 */

const callName = (stage: Stage): string =>
    ({ classify: "classify-section", plan: "plan-component", generate: "generate-component" })[
        stage as "classify" | "plan" | "generate"
    ] ?? `${stage}-call`;

const readUsage = (usage: unknown): { inputTokens: number; outputTokens: number } => {
    const u = (usage ?? {}) as Record<string, number | undefined>;
    return {
        inputTokens: u.inputTokens ?? u.promptTokens ?? 0,
        outputTokens: u.outputTokens ?? u.completionTokens ?? 0
    };
};

const modelIdOf = (params: unknown): string => {
    const model = (params as { model?: unknown })?.model;
    return typeof model === "string" ? model : "";
};

const record = async (
    scope: ModelCallScope.Value,
    modelCalls: ModelCallRepository.Interface,
    modelId: string,
    usage: { inputTokens: number; outputTokens: number },
    durationMs: number,
    ok: boolean
): Promise<void> => {
    try {
        await modelCalls.create({
            runId: scope.runId,
            stage: scope.stage,
            stageVersion: scope.stageVersion,
            name: callName(scope.stage),
            modelId,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            latencyMs: Math.round(durationMs),
            ok
        });
    } catch (error) {
        console.log(
            `[component-extraction] Could not record model call: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};

class ModelCallSuccessRecorderImpl implements AiAfterGenerateTextEventHandler.Interface {
    constructor(
        private scope: ModelCallScope.Interface,
        private modelCalls: ModelCallRepository.Interface
    ) {}

    async handle(event: AiAfterGenerateTextEventHandler.Event): Promise<void> {
        const scope = this.scope.current();
        if (!scope) {
            return;
        }
        const { params, result, duration } = event.payload;
        await record(
            scope,
            this.modelCalls,
            modelIdOf(params),
            readUsage((result as { usage?: unknown }).usage),
            duration,
            true
        );
    }
}

export const ModelCallSuccessRecorder = AiAfterGenerateTextEventHandler.createImplementation({
    implementation: ModelCallSuccessRecorderImpl,
    dependencies: [ModelCallScope, ModelCallRepository]
});

class ModelCallErrorRecorderImpl implements AiGenerateTextErrorEventHandler.Interface {
    constructor(
        private scope: ModelCallScope.Interface,
        private modelCalls: ModelCallRepository.Interface
    ) {}

    async handle(event: AiGenerateTextErrorEventHandler.Event): Promise<void> {
        const scope = this.scope.current();
        if (!scope) {
            return;
        }
        // A failed call carries no usable usage; record zeros so the attempt still shows in the count.
        await record(
            scope,
            this.modelCalls,
            modelIdOf(event.payload.params),
            { inputTokens: 0, outputTokens: 0 },
            event.payload.duration,
            false
        );
    }
}

export const ModelCallErrorRecorder = AiGenerateTextErrorEventHandler.createImplementation({
    implementation: ModelCallErrorRecorderImpl,
    dependencies: [ModelCallScope, ModelCallRepository]
});
