import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import type { ReviewTarget } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { WB_PAGE_FOLDER_TYPE } from "~/constants.js";
import type { WbPageTargetReader } from "./WbPageTargetReader/index.js";

/** Title and typed `TargetContext` of a page revision (spec 9.3, R66). Pure. */
export const toWbPageReviewTarget = (target: WbPageTargetReader.Target): ReviewTarget => {
    const { model, page } = target;
    const title = page.properties.title;
    const folderId = page.location.folderId;
    return {
        title,
        context: {
            folder:
                folderId && folderId !== ROOT_FOLDER
                    ? { id: folderId, type: WB_PAGE_FOLDER_TYPE }
                    : null,
            modelId: model.modelId,
            title,
            author: { id: page.createdBy.id, displayName: page.createdBy.displayName }
        }
    };
};
