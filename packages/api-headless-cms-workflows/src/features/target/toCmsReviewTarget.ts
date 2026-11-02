import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import type { ReviewTarget } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { toCmsFolderType } from "~/utils/folderType.js";
import type { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";

/** Title and typed `TargetContext` of a CMS revision (spec 9.3, R66). Pure. */
export const toCmsReviewTarget = (target: CmsEntryTargetReader.Target): ReviewTarget => {
    const { model, entry } = target;
    const title = getEntryTitle(model, entry);
    const folderId = entry.location?.folderId;
    return {
        title,
        context: {
            folder:
                folderId && folderId !== ROOT_FOLDER
                    ? { id: folderId, type: toCmsFolderType(model.modelId) }
                    : null,
            modelId: model.modelId,
            title,
            author: { id: entry.createdBy.id, displayName: entry.createdBy.displayName }
        }
    };
};
