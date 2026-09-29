import { AiCapability } from "~/api/features/Capabilities/index.js";

export const WB_GENERATE_PAGE_CAPABILITY = "wb.generatePage";

/**
 * No `guidance`, for the same reason as CMS entry generation: the prompt carries the component
 * catalog and the tool definitions, both computed per request.
 */
class WbGeneratePageCapabilityImpl implements AiCapability.Interface {
    readonly id = WB_GENERATE_PAGE_CAPABILITY;
    readonly label = "Page generation";
    readonly description =
        "Writes page content from a prompt using the Website Builder components available in the project.";
    readonly defaultRole = "standard" as const;
}

export const WbGeneratePageCapability = AiCapability.createImplementation({
    implementation: WbGeneratePageCapabilityImpl,
    dependencies: []
});
