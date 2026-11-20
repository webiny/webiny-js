import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { CreatePageTool } from "./CreatePageTool.js";

/**
 * Website Builder tools for AI callers. Building and changing a page's content is done in the page
 * editor, by tools the editor runs in the browser; the API only creates the page.
 */
export const WbAiToolsFeature = createFeature({
    name: "Wb/AiTools",
    register(container) {
        /*
         * AI page generation is licensed on its own (project config && live WCP license). With it
         * off, no AI caller is offered `createPage`, and the editor offers no page tools either.
         */
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.websiteBuilder.pageGeneration");

        if (!enabled) {
            return;
        }

        container.register(CreatePageTool);
    }
});
