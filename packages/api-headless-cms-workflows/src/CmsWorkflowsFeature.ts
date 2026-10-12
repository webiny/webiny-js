import { createFeature } from "@webiny/feature/api";
import { CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { CmsTargetFeature } from "./features/target/feature.js";
import { createEntrySystemSchemaExtension } from "./graphql/entrySystemSchema.js";

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

        // Add the `workflow` field to CmsEntrySystem on the CMS endpoint, which is served from the
        // separate CMS schema and needs its own CmsGraphQLSchemaFactory entry.
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => [createEntrySystemSchemaExtension()]
        });
    }
});
