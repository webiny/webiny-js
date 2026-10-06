import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { COMPONENT_EXTRACTION_CAPABILITY } from "~/features/shared/capability.js";
import {
    ExtractionModelError,
    ExtractionValidationError,
    type ExtractionError
} from "~/domain/errors.js";
import { ModelCallScope } from "./modelCallScope.js";

/**
 * The shared AI entry point for the model-backed stages (Classify, Plan). Generate goes through
 * remote-components' generation path, so token accounting is NOT done here — it is captured for all
 * three stages uniformly by subscribing to the core `Ai`'s events (see `ModelCallRecorder`), which is
 * the one point every model call funnels through.
 *
 * Which model runs comes from AI Power-Ups' capability resolver, never from the settings blob: the
 * `providers` section this used to read is legacy and nothing writes it any more, so a project
 * configured today has it empty and extraction would report "no AI provider" while the admin plainly
 * shows one. The resolver applies the role precedence, checks the model against its connection's
 * vendor and decrypts the key.
 *
 * A "not configured" is a validation error (the user must fix it); a call/parse failure is a model
 * error (transient, a caller may retry or degrade).
 */
export interface AiTextPart {
    type: "text";
    text: string;
}
export interface AiFilePart {
    type: "file";
    data: Uint8Array;
    mediaType: string;
}
export type AiContentPart = AiTextPart | AiFilePart;

export interface AiMessage {
    role: "user" | "assistant";
    content: string | AiContentPart[];
}

export interface IComponentExtractionAi {
    generate(params: {
        system?: string;
        messages: AiMessage[];
        /** The cluster the call is for, so its cost is recorded against it. */
        signature?: string;
    }): Promise<Result<string, ExtractionError>>;
}

export const ComponentExtractionAi =
    createAbstraction<IComponentExtractionAi>("ComponentExtraction/Ai");
export namespace ComponentExtractionAi {
    export type Interface = IComponentExtractionAi;
}

class ComponentExtractionAiImpl implements IComponentExtractionAi {
    constructor(
        private ai: Ai.Interface,
        private modelCallScope: ModelCallScope.Interface,
        // AI Power-Ups registers nothing when the feature is off, so the resolver can be absent.
        private resolveCapability?: ResolveAiCapabilityUseCase.Interface
    ) {}

    async generate({
        system,
        messages,
        signature
    }: {
        system?: string;
        messages: AiMessage[];
        signature?: string;
    }): Promise<Result<string, ExtractionError>> {
        if (!this.resolveCapability) {
            return Result.fail(
                new ExtractionValidationError("AI Power-Ups is not enabled on this project")
            );
        }

        const resolved = await this.resolveCapability.execute(COMPONENT_EXTRACTION_CAPABILITY);
        if (resolved.isFail()) {
            // The resolver's message names the settings screen and what to pick there.
            return Result.fail(new ExtractionValidationError(resolved.error.message));
        }

        try {
            const call = () =>
                this.ai.generateText({
                    model: resolved.value.model,
                    connection: resolved.value.connection,
                    system,
                    messages
                } as Parameters<Ai.Interface["generateText"]>[0]);
            const result = signature
                ? await this.modelCallScope.forComponent(signature, call)
                : await call();

            const steps = (result.steps ?? []) as Array<{ text?: string }>;
            const text =
                result.text ||
                steps.filter(step => step.text && step.text.length > 0).pop()?.text ||
                "";

            if (!text) {
                return Result.fail(
                    new ExtractionModelError("the model returned an empty response")
                );
            }
            return Result.ok(text);
        } catch (error) {
            return Result.fail(
                new ExtractionModelError(error instanceof Error ? error.message : String(error))
            );
        }
    }
}

export const ComponentExtractionAiService = createImplementation({
    abstraction: ComponentExtractionAi,
    implementation: ComponentExtractionAiImpl,
    dependencies: [Ai, ModelCallScope, [ResolveAiCapabilityUseCase, { optional: true }]]
});
