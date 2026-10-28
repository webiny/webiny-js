import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WbTranslatePageDecorator } from "./WbTranslatePageDecorator.js";
import { LexicalParser } from "./LexicalParser.js";
import { WbTranslatePageCapability } from "./capability.js";

export const WbTranslatePageFeature = createFeature({
    name: "AiPowerUps/WbTranslatePage",
    register(container) {
        /*
         * Register-time gate on the effective feature flags (project config && live WCP license),
         * the same as AiImageEnrichmentFeature. Without it, translating a page still copies it into
         * the target language, untranslated.
         */
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.websiteBuilder.pageTranslation");

        if (!enabled) {
            return;
        }

        container.register(WbTranslatePageCapability);
        container.register(LexicalParser).inSingletonScope();
        container.registerDecorator(WbTranslatePageDecorator);
    }
});
