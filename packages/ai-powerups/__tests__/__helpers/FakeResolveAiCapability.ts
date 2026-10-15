import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";

export const createResolvedCapability = (model: string): ResolveAiCapabilityUseCase.Resolution => {
    return {
        capabilityId: "workflows.review",
        model,
        connection: { sdkName: "anthropic", apiKey: "decrypted:key" },
        roleId: null,
        fellBackToStandard: false,
        guidance: "Guidance.",
        additionalInstructions: ""
    };
};

export interface ResolveCall {
    capabilityId: string;
    model: string | undefined;
}

/** What the fake answers for a call; by default the capability resolved on the model given. */
export type ResolveOutcome = (
    model: string | undefined
) => Promise<Result<ResolveAiCapabilityUseCase.Resolution, Error>>;

/** Registers a `ResolveAiCapabilityUseCase` that records its calls. Nothing is decrypted or read. */
export const registerFakeResolveAiCapability = (container: Container, outcome?: ResolveOutcome) => {
    const calls: ResolveCall[] = [];
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async (capabilityId: string, model?: string) => {
            calls.push({ capabilityId, model });
            if (outcome) {
                return outcome(model);
            }
            return Result.ok(createResolvedCapability(model ?? "anthropic/claude-a"));
        }
    });
    return { calls };
};
