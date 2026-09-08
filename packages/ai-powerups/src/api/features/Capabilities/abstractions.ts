import { createAbstraction, Result } from "@webiny/feature/api";
import type { AiModelRoleId } from "~/api/features/ModelRoles/index.js";

/**
 * One AI feature, declared so the settings screen can list it and a project can point it at a
 * different model or adjust its prompt.
 *
 * Features register these; nothing hardcodes the list. An extension that adds an AI feature gets a
 * row in Settings for free by registering a capability alongside it.
 */
export interface IAiCapability {
    /** Stable, namespaced, and persisted as a settings key. Renaming one orphans its overrides. */
    readonly id: string;
    readonly label: string;
    readonly description: string;
    /** Which role supplies the model when the project has not overridden this capability. */
    readonly defaultRole: AiModelRoleId;
    /**
     * The static system-prompt block, for capabilities whose prompt is a fixed piece of text a
     * project could sensibly replace outright.
     *
     * Leave it undefined when the prompt is assembled per request (from a content model schema, a
     * component catalog, a persona). The settings screen then offers only "additional
     * instructions", because offering a full replacement for a prompt the code rebuilds every call
     * would just be a way to break generation.
     */
    readonly guidance?: string;
}

export const AiCapability = createAbstraction<IAiCapability>("AiPowerUpsAiCapability");

export namespace AiCapability {
    export type Interface = IAiCapability;
}

export interface IResolvedAiCapability {
    capabilityId: string;
    /** Fully qualified, e.g. `"anthropic/claude-sonnet-4-5"`. */
    model: string;
    connection: {
        sdkName: string;
        apiKey: string;
    };
    /** Which role supplied the model. `null` when a capability override pinned it directly. */
    roleId: AiModelRoleId | null;
    /** True when the requested role was empty and `standard` filled in for it. */
    fellBackToStandard: boolean;
    /** The capability's guidance, or the project's replacement for it. */
    guidance: string;
    /** Project text to append to the system prompt. Empty when unset. */
    additionalInstructions: string;
}

export interface IResolveAiCapabilityUseCase {
    execute(capabilityId: string): Promise<Result<IResolvedAiCapability, Error>>;
}

export const ResolveAiCapabilityUseCase = createAbstraction<IResolveAiCapabilityUseCase>(
    "AiPowerUpsResolveAiCapabilityUseCase"
);

export namespace ResolveAiCapabilityUseCase {
    export type Interface = IResolveAiCapabilityUseCase;
    export type Resolution = IResolvedAiCapability;
}
