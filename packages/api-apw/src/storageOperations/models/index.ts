import contentModelPluginFactory from "./contentModelPluginFactory";
import WebinyError from "@webiny/error";
import { CmsGroupPlugin } from "@webiny/api-headless-cms";
import { createWorkflowModelDefinition } from "./workflow.model";
import { createContentReviewModelDefinition } from "./contentReview.model";
import { createReviewerModelDefinition } from "./reviewer.model";
import { createCommentModelDefinition } from "./comment.model";
import { createChangeRequestModelDefinition } from "./changeRequest.model";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { isInstallationPending } from "~/plugins/utils";

export const createApwModels = (context: CmsContext) => {
    /**
     * This should never happen in the actual project.
     * It is to make sure that we load setup context before the CRUD init in our internal code.
     */
    if (!context.cms) {
        console.warn("Creating model before cms init.");
        return;
    }

    if (isInstallationPending({ tenancy: context.tenancy, i18n: context.i18n })) {
        return;
    }

    context.security.disableAuthorization();

    const locale = context.i18n.getContentLocale();
    if (!locale) {
        throw new WebinyError(
            "Missing content locale in api-apw/storageOperations/index.ts",
            "LOCALE_ERROR"
        );
    }
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
        description: "Group for Advanced Publishing Workflow",
        icon: "fas/star",
        isPrivate: true
    });

    /**
     * Create  CmsModel plugins.
     */
    const changeRequestModelDefinition = createChangeRequestModelDefinition();
    const reviewerModelDefinition = createReviewerModelDefinition();
    const workflowModelDefinition = createWorkflowModelDefinition({
        reviewerModelId: reviewerModelDefinition.modelId
    });
    const commentModelDefinition = createCommentModelDefinition({
        modelId: changeRequestModelDefinition.modelId
    });
    const contentReviewModelDefinition = createContentReviewModelDefinition({
        reviewerModelId: reviewerModelDefinition.modelId
    });

    const modelDefinitions = [
        workflowModelDefinition,
        contentReviewModelDefinition,
        reviewerModelDefinition,
        changeRequestModelDefinition,
        commentModelDefinition
    ];

    const cmsModelPlugins = [];
    for (const modelDefinition of modelDefinitions) {
        const cmsModelPlugin = contentModelPluginFactory({
            group: cmsGroupPlugin.contentModelGroup,
            tenant: context.tenancy.getCurrentTenant().id,
            locale: locale.code,
            modelDefinition
        });
        /**
         * We want "title" field as the "titleField" for "ContentReview" model.
         * so that we can later search entries by title.
         */
        if (cmsModelPlugin.contentModel.modelId === "apwContentReviewModelDefinition") {
            cmsModelPlugin.contentModel.titleFieldId = "title";
        }
        cmsModelPlugins.push(cmsModelPlugin);
    }

    /**
     *  Register them so that they are accessible in cms context
     */
    context.plugins.register([cmsGroupPlugin, cmsModelPlugins]);

    context.security.enableAuthorization();
};
