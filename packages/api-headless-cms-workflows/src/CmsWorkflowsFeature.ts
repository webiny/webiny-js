import { type Container, createFeature } from "@webiny/feature/api";
import { CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { createEntrySystemSchemaExtension } from "./graphql/entrySystemSchema.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container: Container) {
        // WCP guard is enforced inside WorkflowsContextEnhancer — register unconditionally.
        EntryWorkflowsFeature.register(container);
        CmsLocalWorkflowsFeature.register(container);
        WorkflowsFeature.register(container);

        // Add the `workflow` field to CmsEntrySystem on the CMS endpoint. (api-workflows extends
        // CmsEntrySystem on the base /graphql schema via WorkflowsSchemaFactory, but CMS entries are
        // served from the separate CMS schema, which needs its own CmsGraphQLSchemaFactory entry.)
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => [createEntrySystemSchemaExtension()]
        });
    }
});
