import { AiCapability } from "~/api/features/Capabilities/index.js";
import { AI_ENRICHMENT_PROMPT } from "./abstractions.js";

export const FM_IMAGE_ENRICHMENT_CAPABILITY = "fm.imageEnrichment";

class FmImageEnrichmentCapabilityImpl implements AiCapability.Interface {
    readonly id = FM_IMAGE_ENRICHMENT_CAPABILITY;
    readonly label = "Image enrichment";
    readonly description =
        "Reads an uploaded image and writes its alt text, title and tags. Needs a model that accepts image input.";
    readonly defaultRole = "vision" as const;
    /**
     * The one prompt here whose structure does not come from the prose: `Output.object(...)` in
     * `buildEnrichmentAiRequest` enforces the tags/description shape. Projects still adjust it by
     * appending, which is where house tag vocabularies go ("use our taxonomy", "British spelling").
     */
    readonly guidance = AI_ENRICHMENT_PROMPT;
}

export const FmImageEnrichmentCapability = AiCapability.createImplementation({
    implementation: FmImageEnrichmentCapabilityImpl,
    dependencies: []
});
