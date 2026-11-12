import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";
import type { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import type { CmsModel } from "~/types/index.js";

const HIDDEN_MODEL_GROUP = "hidden";

/**
 * Models Webiny itself owns. Two separate markers, both needed:
 *  - `group: "hidden"` — the convention system models use (languages, tenants, background-task
 *    settings). The admin UI filters the same way, see app-headless-cms useCmsData.
 *  - `isPrivate` — models another app owns and manages through its own UI (e.g. Website Builder).
 */
export const isSystemModel = (model: CmsModel): boolean =>
    Boolean(model.isPrivate) || model.group === HIDDEN_MODEL_GROUP;

/**
 * Loads a model the entry write tools may change. System models are refused: their entries back
 * Webiny itself or another app, which keeps rules the CMS does not know about. Singleton models are
 * refused too: they hold one entry, edited on its own screen, not created or deleted.
 */
export const getWritableModel = async (
    getModel: GetModelUseCase.Interface,
    modelId: string
): Promise<CmsModel> => {
    const result = await getModel.execute(modelId);

    if (result.isFail()) {
        throw new Error(
            `Unknown model "${modelId}": ${result.error.message}. Call listContentModels for valid model IDs.`
        );
    }

    const model = result.value;

    if (isSystemModel(model)) {
        throw new Error(`"${modelId}" is a system model; its entries cannot be changed here.`);
    }

    if (model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
        throw new Error(
            `"${modelId}" is a single-entry model; edit it on its own screen in the admin.`
        );
    }

    return model;
};
