import { createFeature } from "@webiny/feature/api";
import { CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { createEntrySystemSchemaExtension } from "./graphql/entrySystemSchema.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Entry handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as target adapters in phase 2.
        CmsLocalWorkflowsFeature.register(container);

        // Add the `workflow` field to CmsEntrySystem on the CMS endpoint, which is served from the
        // separate CMS schema and needs its own CmsGraphQLSchemaFactory entry.
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => [createEntrySystemSchemaExtension()]
        });
    }
});
