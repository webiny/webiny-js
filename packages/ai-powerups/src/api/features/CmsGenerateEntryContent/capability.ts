import { AiCapability } from "~/api/features/Capabilities/index.js";

export const CMS_GENERATE_ENTRY_CAPABILITY = "cms.generateEntry";

/**
 * No `guidance`: this prompt is rebuilt on every request from the content model's JSON Schema and
 * the File Manager's current image tags, so there is no fixed block a project could replace without
 * dropping the schema the output has to conform to. Additional instructions still apply.
 */
class CmsGenerateEntryCapabilityImpl implements AiCapability.Interface {
    readonly id = CMS_GENERATE_ENTRY_CAPABILITY;
    readonly label = "CMS entry generation";
    readonly description =
        "Writes a content entry from a prompt, following the content model's schema and picking images from the File Manager.";
    readonly defaultRole = "standard" as const;
}

export const CmsGenerateEntryCapability = AiCapability.createImplementation({
    implementation: CmsGenerateEntryCapabilityImpl,
    dependencies: []
});
