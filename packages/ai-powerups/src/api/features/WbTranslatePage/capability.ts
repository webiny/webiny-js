import { AiCapability } from "~/api/features/Capabilities/index.js";

export const WB_TRANSLATE_PAGE_CAPABILITY = "wb.translatePage";

/**
 * The target language used to be interpolated into this sentence. It moved to the user prompt so
 * the instructions could become fixed text a project can replace, which is worth doing here: house
 * translation rules (keep product names in English, use formal address, never translate these
 * twelve terms) are the most commonly requested prompt change in the whole feature set.
 */
const guidance =
    "You are a professional translator. Translate all user-provided text to the requested target language, preserving placeholders and formatting. Return a JSON object with the same keys, only changing the values.";

class WbTranslatePageCapabilityImpl implements AiCapability.Interface {
    readonly id = WB_TRANSLATE_PAGE_CAPABILITY;
    readonly label = "Page translation";
    readonly description =
        "Translates the text on a page into another language, preserving placeholders.";
    readonly defaultRole = "standard" as const;
    readonly guidance = guidance;
}

export const WbTranslatePageCapability = AiCapability.createImplementation({
    implementation: WbTranslatePageCapabilityImpl,
    dependencies: []
});
