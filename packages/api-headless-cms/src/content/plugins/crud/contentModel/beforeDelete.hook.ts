import { CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

export const beforeDeleteHook = async (context: CmsContext, modelId: string) => {
    const manager = await context.cms.getModel(modelId);
    const [entries] = await manager.list({
        limit: 1
    });
    if (entries.length === 0) {
        return;
    }
    throw new WebinyError(
        `Cannot delete content model "${modelId}" because there are existing entries.`,
        "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
    );
};
