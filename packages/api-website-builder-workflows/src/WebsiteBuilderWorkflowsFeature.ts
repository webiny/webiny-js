import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WbTargetFeature } from "./features/target/feature.js";
import { WebsiteBuilderPageSchemaFactory } from "./WebsiteBuilderPageSchemaFactory.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Page handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as the `wb.page` target adapter in phase 2, next to the Website Builder wrapper use cases
        // and GraphQL operations that read the identity and check permissions (D132, D133).
        container.register(WebsiteBuilderPageSchemaFactory);

        // The `wb.page` target adapter (spec 9.3).
        WbTargetFeature.register(container);
    }
});
