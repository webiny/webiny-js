import { AiCapability } from "@webiny/ai-powerups/exports/api/ai-powerups.js";

export const REMOTE_COMPONENT_GENERATION_CAPABILITY = "wb.remoteComponentGeneration";

/**
 * Generating and refining a remote component, as one capability.
 *
 * `vision`, because both calls accept reference images (`additionalFileIds` becomes image parts) and
 * that is the normal way to use them — a screenshot of the thing you want built. An unfilled `vision`
 * role falls back to `standard`, which the settings screen says next to the role.
 *
 * Generation and refinement share the row deliberately: a refinement is the same model continuing the
 * same job, and a project that wanted them on different models would have no way to reason about the
 * result.
 *
 * No `guidance`: `buildComponentPrompt` and `buildRefinePrompt` carry the source-shape contract that
 * `parseGeneratedSource` depends on, so they are implementation rather than settings.
 */
class RemoteComponentGenerationCapability implements AiCapability.Interface {
    readonly id = REMOTE_COMPONENT_GENERATION_CAPABILITY;
    readonly label = "Component generation";
    readonly description =
        "Writes and refines Website Builder components from a prompt. Accepts reference images, so it needs a model with image input.";
    readonly defaultRole = "vision" as const;
}

export const RemoteComponentGenerationCapabilityImplementation = AiCapability.createImplementation({
    implementation: RemoteComponentGenerationCapability,
    dependencies: []
});
