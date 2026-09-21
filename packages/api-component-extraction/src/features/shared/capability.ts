import { AiCapability } from "@webiny/ai-powerups/exports/api/ai-powerups.js";

export const COMPONENT_EXTRACTION_CAPABILITY = "componentExtraction.analysis";

/**
 * Classify and Plan, as one capability: both read a section's digest and answer a question about it,
 * both are steered by the same "how should this site be modelled" intent, and splitting them would
 * put two rows in Settings that nobody would ever set differently.
 *
 * `standard`, not `vision`: these two calls are text-only (structure summary plus text snippets).
 * Generate is the stage that sends the reference crop, and it goes through remote components'
 * generation capability, which asks for `vision`.
 *
 * No `guidance`: each prompt is built per call from the cluster digest and the theme manifest, and
 * carries the JSON contract the parsers depend on.
 */
class ComponentExtractionCapability implements AiCapability.Interface {
    readonly id = COMPONENT_EXTRACTION_CAPABILITY;
    readonly label = "Component extraction analysis";
    readonly description =
        "Names and classifies the sections found on a crawled site, and proposes each component's props and token bindings.";
    readonly defaultRole = "standard" as const;
}

export const ComponentExtractionCapabilityImplementation = AiCapability.createImplementation({
    implementation: ComponentExtractionCapability,
    dependencies: []
});
