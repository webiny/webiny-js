import { AiCapability } from "@webiny/ai-powerups/exports/api/ai-powerups.js";

export const REMOTE_COMPONENT_CAPABILITY = "wb.generateComponent";

/**
 * Generating and refining a component, as one capability.
 *
 * One rather than two because both do the same job: write component source against the same
 * output contract that `parseGeneratedSource` reads. A project choosing a model for one would
 * want it for the other, and two rows in settings would only invite them to drift.
 *
 * No `guidance`. Each use case builds its own system prompt, generate and refine differ, so the
 * prompt is passed to `withAdditionalInstructions` per request rather than declared here.
 *
 * `standard` like entry generation, which also accepts image attachments. Writing working
 * component code is where small models fall down, and the attachments are optional.
 */
class RemoteComponentCapabilityImpl implements AiCapability.Interface {
    readonly id = REMOTE_COMPONENT_CAPABILITY;
    readonly label = "Component generation";
    readonly description =
        "Writes and refines Website Builder components from a prompt and optional reference images.";
    readonly defaultRole = "standard" as const;
}

export const RemoteComponentCapability = AiCapability.createImplementation({
    implementation: RemoteComponentCapabilityImpl,
    dependencies: []
});
