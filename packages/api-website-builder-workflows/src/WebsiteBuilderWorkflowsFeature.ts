import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WbHooksFeature } from "./features/hooks/feature.js";
import { WbWrappersFeature } from "./features/wrappers/feature.js";
import { WbTargetFeature } from "./features/target/feature.js";
import { WebsiteBuilderPageSchemaFactory } from "./WebsiteBuilderPageSchemaFactory.js";
import { WebsiteBuilderWorkflowsSchemaFactory } from "./graphql/WebsiteBuilderWorkflowsSchemaFactory.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Page handlers (system.workflow sync, publish and move rules, target delete) live in the
        // `wb.page` target adapter and hooks, next to the Website Builder wrapper use cases that
        // read the identity and check permissions (D132, D133).
        container.register(WebsiteBuilderPageSchemaFactory);
        // Every pages workflow and review operation on the `websiteBuilder` root (D136, R88).
        container.register(WebsiteBuilderWorkflowsSchemaFactory);

        // The `wb.page` target adapter (spec 9.3).
        WbTargetFeature.register(container);
        WbHooksFeature.register(container);
        WbWrappersFeature.register(container);
    }
});
