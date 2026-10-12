import { createFeature } from "@webiny/feature/api";
import { StoreWebsiteBuilderPageWorkflowFeature } from "./StoreWebsiteBuilderPageWorkflow/feature.js";
import { DeleteWebsiteBuilderPageWorkflowFeature } from "./DeleteWebsiteBuilderPageWorkflow/feature.js";
import { ListWebsiteBuilderPageWorkflowsFeature } from "./ListWebsiteBuilderPageWorkflows/feature.js";
import { GetWebsiteBuilderPageWorkflowFeature } from "./GetWebsiteBuilderPageWorkflow/feature.js";

/**
 * The Website Builder wrapper use cases (D132, D133, R45): identity, `workflows` permission and page
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
 */
export const WbWrappersFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Wrappers",
    register(container) {
        // Workflows
        StoreWebsiteBuilderPageWorkflowFeature.register(container);
        DeleteWebsiteBuilderPageWorkflowFeature.register(container);
        ListWebsiteBuilderPageWorkflowsFeature.register(container);
        GetWebsiteBuilderPageWorkflowFeature.register(container);
    }
});
