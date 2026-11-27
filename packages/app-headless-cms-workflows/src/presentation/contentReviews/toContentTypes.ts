import { CMS_MODEL_PUBLISHING_DISABLED_TAG } from "@webiny/app-headless-cms-common";
import { isSingletonModel } from "@webiny/app-headless-cms-common";
import type { ContentType } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";

/*
 * The content types a Content Reviews list can show: bindable models that are not being deleted,
 * sorted by name. Singleton models are never bound to a workflow, so they are left out. Private models are not in the admin list (`listContentModels` excludes them).
 */
export const toContentTypes = (models: ListedModel[]): ContentType[] => {
    const bindable = models.filter(model => {
        if (model.isBeingDeleted) {
            return false;
        }
        if (isSingletonModel({ tags: model.tags ?? [] })) {
            return false;
        }
        // Models that cannot be published cannot be bound to a workflow (mirror of `isBindableModel`).
        return !(model.tags ?? []).includes(CMS_MODEL_PUBLISHING_DISABLED_TAG);
    });

    return bindable
        .map(model => {
            return { modelId: model.modelId, name: model.name };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
};
