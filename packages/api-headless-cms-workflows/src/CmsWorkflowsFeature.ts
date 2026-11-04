import { createFeature } from "@webiny/feature/api";
import { CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { CmsTargetFeature } from "./features/target/feature.js";
import { CmsHooksFeature } from "./features/hooks/feature.js";
import { CmsWrappersFeature } from "./features/wrappers/feature.js";
import { createEntrySystemSchemaExtension } from "./graphql/entrySystemSchema.js";
import { CmsWorkflowsSchemaFactory } from "./graphql/CmsWorkflowsSchemaFactory.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Bindable-model checks on the engine's workflow before-save events.
        CmsLocalWorkflowsFeature.register(container);

        // The `cms.*` target adapter (spec 9.3).
        CmsTargetFeature.register(container);

        // Workflow handlers on CMS events (spec 9.2).
        CmsHooksFeature.register(container);

        // Wrapper use cases (identity, permission and target checks around the engine).
        CmsWrappersFeature.register(container);

        // Every CMS workflow and review operation on the `cms` root of `/graphql` (R88).
        container.register(CmsWorkflowsSchemaFactory);

        // Add the `workflow` field to CmsEntrySystem on the CMS endpoint, which is served from the
        // separate CMS schema and needs its own CmsGraphQLSchemaFactory entry.
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => [createEntrySystemSchemaExtension()]
        });
    }
});
