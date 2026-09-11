import { AiCapability } from "~/api/features/Capabilities/index.js";

export const FM_IMAGE_ENRICHMENT_CAPABILITY = "fm.imageEnrichment";

/**
 * The prompt lives here rather than in the task now, because it is the capability's, and the
 * resolver hands it back with the project's additional instructions already appended.
 *
 * This is the one AI prompt whose structure does not come from the prose: `Output.object(...)` in
 * the task enforces the tags/description shape. House tag vocabularies go in additional
 * instructions ("use our taxonomy", "no more than three tags", "British spelling").
 */
const guidance =
    "Analyze this image and return up to 5 lowercase descriptive tags and one short sentence describing the image.";

class FmImageEnrichmentCapabilityImpl implements AiCapability.Interface {
    readonly id = FM_IMAGE_ENRICHMENT_CAPABILITY;
    readonly label = "Image enrichment";
    readonly description =
        "Reads an uploaded image and writes its alt text, title and tags. Needs a model that accepts image input.";
    readonly defaultRole = "vision" as const;
    readonly guidance = guidance;
}

export const FmImageEnrichmentCapability = AiCapability.createImplementation({
    implementation: FmImageEnrichmentCapabilityImpl,
    dependencies: []
});
