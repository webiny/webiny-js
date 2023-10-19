import { CmsContext } from "~/types";
import { CmsImportAction, CmsModelImportResult, ValidCmsModelResult } from "~/export/types";

interface Params {
    context: CmsContext;
    models: ValidCmsModelResult[];
}

export const importModels = async (params: Params) => {
    const { context, models } = params;

    const groups = await context.cms.listGroups();

    const results: CmsModelImportResult[] = [];

    for (const model of models) {
        /**
         * There is a possibility that group does not exist.
         */
        const group = groups.find(group => {
            return group.id === model.model.group;
        });
        if (!group) {
            results.push({
                action: model.action,
                model: model.model,
                related: model.related,
                imported: false,
                error: {
                    message: `Group "${model.model.group}" does not exist.`,
                    code: "GROUP_NOT_FOUND",
                    data: {
                        model
                    }
                }
            });
            continue;
        }
        /**
         * No update action or there is a validation error.
         */
        if (model.action === CmsImportAction.NONE || model.error) {
            results.push({
                action: model.action,
                model: model.model,
                related: model.related,
                imported: false,
                error: model.error || {
                    message: "No action to be ran on the model.",
                    code: "NO_ACTION"
                }
            });
            continue;
        }
        /**
         * Cannot update a model if it is created via plugin.
         */
        if (model.action === CmsImportAction.CODE) {
            results.push({
                action: model.action,
                model: model.model,
                related: model.related,
                imported: true
            });
            continue;
        }

        /**
         * Update the model
         */
        //
        if (model.action === CmsImportAction.UPDATE) {
            try {
                const result = await context.cms.updateModel(model.model.modelId, model.model);
                results.push({
                    action: model.action,
                    model: {
                        ...result,
                        group: group.id
                    },
                    related: model.related,
                    imported: true
                });
            } catch (ex) {
                results.push({
                    action: model.action,
                    model: model.model,
                    imported: false,
                    related: model.related,
                    error: {
                        message: ex.message,
                        code: ex.code || "UPDATE_MODEL_ERROR",
                        data: {
                            model: model.model,
                            ...ex.data
                        }
                    }
                });
            }
            continue;
        }
        /**
         * Create a new model.
         */
        try {
            const result = await context.cms.createModel(model.model);
            results.push({
                action: model.action,
                model: {
                    ...result,
                    group: group.id
                },
                related: model.related,
                imported: true
            });
        } catch (ex) {
            results.push({
                action: model.action,
                model: model.model,
                imported: false,
                related: model.related,
                error: {
                    message: ex.message,
                    code: ex.code || "CREATE_MODEL_ERROR",
                    data: {
                        model: model.model,
                        ...ex.data
                    }
                }
            });
        }
    }

    return results;
};
