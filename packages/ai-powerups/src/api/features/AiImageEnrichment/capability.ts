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
     * Fixed text, and the field a project is most likely to want to change: tag vocabularies are
     * house style ("use our taxonomy", "no more than three tags", "British spelling").
     */
    readonly guidance = AI_ENRICHMENT_PROMPT;
}

export const FmImageEnrichmentCapability = AiCapability.createImplementation({
    implementation: FmImageEnrichmentCapabilityImpl,
    dependencies: []
});
