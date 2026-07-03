import type { CmsContext } from "~/types/index.js";
import type { CmsModelImportResult, ValidCmsModelResult } from "~/export/types.js";
import { CmsImportAction } from "~/export/types.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { UpdateModelUseCase } from "~/features/contentModel/UpdateModel/index.js";
import { CreateModelUseCase } from "~/features/contentModel/CreateModel/index.js";

interface Params {
    context: CmsContext;
    models: ValidCmsModelResult[];
}

export const importModels = async (params: Params) => {
    const { context, models } = params;

    const groupsResult = await context.container.resolve(ListGroupsUseCase).execute();
    if (groupsResult.isFail()) {
        throw groupsResult.error;
    }
    const groups = groupsResult.value;

    const results: CmsModelImportResult[] = [];

    for (const model of models) {
        /**
         * There is a possibility that group does not exist.
         */
        const group = groups.find(group => {
            return group.slug === model.model.group;
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
            const updateResult = await context.container
                .resolve(UpdateModelUseCase)
                .execute(model.model.modelId, model.model);
            if (updateResult.isFail()) {
                const ex = updateResult.error;
                results.push({
                    action: model.action,
                    model: model.model,
                    imported: false,
                    related: model.related,
                    error: {
                        message: ex.message,
                        code: (ex as any).code || "UPDATE_MODEL_ERROR",
                        data: { model: model.model, ...(ex as any).data }
                    }
                });
            } else {
                results.push({
                    action: model.action,
                    model: { ...updateResult.value, group: group.slug },
                    related: model.related,
                    imported: true
                });
            }
            continue;
        }
        /**
         * Create a new model.
         */
        const createResult = await context.container
            .resolve(CreateModelUseCase)
            .execute(model.model);
        if (createResult.isFail()) {
            const ex = createResult.error;
            results.push({
                action: model.action,
                model: model.model,
                imported: false,
                related: model.related,
                error: {
                    message: ex.message,
                    code: (ex as any).code || "CREATE_MODEL_ERROR",
                    data: { model: model.model, ...(ex as any).data }
                }
            });
        } else {
            results.push({
                action: model.action,
                model: { ...createResult.value, group: group.slug },
                related: model.related,
                imported: true
            });
        }
    }

    return results;
};
