import { createFeature } from "webiny/api";
import { ComponentExtractionFeature } from "webiny/api/component-extraction";

/**
 * Enables Component Extraction (crawl a site and generate components from it) on this project.
 *
 * The backend — `@webiny/api-component-extraction` — ships everything: the crawler/capture browser,
 * the nine background-task stages, the private CMS models and the GraphQL schema. Registering the
 * feature here is what makes that schema load; without it, the Admin's calls fail with
 * `Unknown type "ComponentExtractionCreateJobInput"`.
 *
 * The model-backed stages (Classify, Plan, Generate) read the AI provider from AI Power-Ups settings
 * internally — the same provider the rest of the Admin uses — so there is no seam to fill here.
 * Prerequisite: register this extension in `webiny.config.tsx` and configure a provider in AI
 * Power-Ups settings.
 */
export default createFeature({
    name: "MyApp/ComponentExtraction",
    register(container) {
        ComponentExtractionFeature.register(container);
    }
});
