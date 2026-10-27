import type { ContentType } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";

// Models that cannot be published cannot be bound to a workflow (mirror of `isBindableModel`).
const UNPUBLISHABLE_MODEL_TAG = "$publishing:false";

/*
 * The content types a Content Reviews list can show: bindable models that are not being deleted,
 * sorted by name. Private models are not in the admin list (`listContentModels` excludes them).
 */
export const toContentTypes = (models: ListedModel[]): ContentType[] => {
    const bindable = models.filter(model => {
        if (model.isBeingDeleted) {
            return false;
        }
        return !(model.tags ?? []).includes(UNPUBLISHABLE_MODEL_TAG);
    });

    return bindable
        .map(model => {
            return { modelId: model.modelId, name: model.name };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
};
