import { CmsContext } from "~/types";
import { CmsModelImportResult, ValidCmsModelResult } from "~/export/types";

interface Params {
    context: CmsContext;
    models: ValidCmsModelResult[];
}

export const importModels = async (params: Params) => {
    const { context, models } = params;

    const groups = await context.cms.listGroups();
    const existingModels = await context.security.withoutAuthorization(async () => {
        return context.cms.listModels();
    });

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
                model: model.model,
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
         * There is a possibility that model with unique values already exists.
         */
        const existingModel = existingModels.find(m => {
            return (
                m.modelId === model.model.modelId ||
                m.singularApiName === model.model.singularApiName ||
                m.pluralApiName === model.model.pluralApiName
            );
        });
        if (existingModel) {
            results.push({
                model: model.model,
                imported: false,
                error: {
                    message: `Model already exists.`,
                    code: "MODEL_EXISTS",
                    data: {
                        existing: {
                            modelId: existingModel.modelId,
                            singularApiName: existingModel.singularApiName,
                            pluralApiName: existingModel.pluralApiName
                        }
                    }
                }
            });
            continue;
        }
        try {
            const result = await context.cms.createModel(model.model);
            results.push({
                model: {
                    ...result
                },
                imported: true
            });
        } catch (ex) {
            results.push({
                model: model.model,
                imported: false,
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
