import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { CmsGroupPlugin } from "@webiny/api-headless-cms/content/plugins/CmsGroupPlugin";
import { ApwContext } from "~/types";
import contentModelPluginFactory from "./contentModelPluginFactory";
import { createWorkflowModelDefinition } from "./workflow.model";
import { contentReviewModelDefinition } from "./contentReview.model";
import { createReviewerModelDefinition } from "./reviewer.model";
import { createCommentModelDefinition } from "./comment.model";
import { createChangeRequestedModelDefinition } from "./changeRequested.model";

export const createApwModels = () =>
    new ContextPlugin<ApwContext>(async context => {
        /**
         * This should never happen in the actual project.
         * It is to make sure that we load setup context before the CRUD init in our internal code.
         */
        if (!context.cms) {
            return;
        }
        context.security.disableAuthorization();
        /**
         * TODO:@ashutosh
         * We need to move these plugin in an installation plugin
         */
        const groupId = "contentModelGroup_apw";
        /**
         * Create a CmsGroup.
         */
        const cmsGroupPlugin = new CmsGroupPlugin({
            id: groupId,
            slug: "apw",
            name: "APW",
            description: "Group for Advanced Publishing Workflow"
        });

        /**
         * Create  CmsModel plugins.
         */
        const changeRequestedModelDefinition = createChangeRequestedModelDefinition();
        const reviewerModelDefinition = createReviewerModelDefinition();
        const workflowModelDefinition = createWorkflowModelDefinition({
            reviewerModelId: reviewerModelDefinition.modelId
        });
        const commentModelDefinition = createCommentModelDefinition({
            modelId: changeRequestedModelDefinition.modelId
        });

        const modelDefinitions = [
            workflowModelDefinition,
            contentReviewModelDefinition,
            reviewerModelDefinition,
            changeRequestedModelDefinition,
            commentModelDefinition
        ];

        const cmsModelPlugins = [];
        for (const modelDefinition of modelDefinitions) {
            const cmsModelPlugin = contentModelPluginFactory({
                group: cmsGroupPlugin.contentModelGroup,
                tenant: context.tenancy.getCurrentTenant().id,
                locale: context.i18nContent.getLocale().code,
                modelDefinition
            });
            cmsModelPlugins.push(cmsModelPlugin);
        }

        /**
         *  Register them so that they are accessible in cms context
         */
        context.plugins.register([cmsGroupPlugin, cmsModelPlugins]);

        context.security.enableAuthorization();
    });
