import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { PageWorkflowsFeature } from "./features/PageWorkflows/feature.js";
import { WebsiteBuilderPageSchemaFactory } from "./WebsiteBuilderPageSchemaFactory.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        PageWorkflowsFeature.register(container);
        container.register(WebsiteBuilderPageSchemaFactory);
    }
});
