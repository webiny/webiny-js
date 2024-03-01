import WebinyError from "@webiny/error";
import { CmsModelPlugin, createCmsModel } from "@webiny/api-headless-cms";
import { createWorkflowModel } from "./workflow.model";
import { createContentReviewModel } from "./contentReview.model";
import { createReviewerModel } from "./reviewer.model";
import { createCommentModel } from "./comment.model";
import { createChangeRequestModel } from "./changeRequest.model";
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

    const locale = context.i18n.getContentLocale();
    if (!locale) {
        throw new WebinyError(
            "Missing content locale in api-apw/storageOperations/index.ts",
            "LOCALE_ERROR"
        );
    }

    /**
     * Create  CmsModel plugins.
     */
    const changeRequestModelDefinition = createChangeRequestModel();
    const reviewerModelDefinition = createReviewerModel();
    const workflowModelDefinition = createWorkflowModel({
        reviewerModelId: reviewerModelDefinition.modelId
    });
    const commentModelDefinition = createCommentModel({
        modelId: changeRequestModelDefinition.modelId
    });
    const contentReviewModelDefinition = createContentReviewModel({
        reviewerModelId: reviewerModelDefinition.modelId
    });

    const modelDefinitions = [
        workflowModelDefinition,
        contentReviewModelDefinition,
        reviewerModelDefinition,
        changeRequestModelDefinition,
        commentModelDefinition
    ];

    const cmsModelPlugins: CmsModelPlugin[] = [];
    for (const modelDefinition of modelDefinitions) {
        const cmsModelPlugin = createCmsModel(modelDefinition);
        /**
         * We want "title" field as the title field for "ContentReview" model.
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
    context.plugins.register(...cmsModelPlugins);
};
