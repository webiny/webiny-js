import type { CmsContext } from "~/types/index.js";
import { getModel, getErrorMessage } from "./helpers.js";
import { ComponentMapGenerator } from "~/features/contentModel/ComponentMapGenerator/abstractions.js";
import { ValuesSelectionGenerator } from "~/features/contentModel/ValuesSelectionGenerator/abstractions.js";
import { RefModelsGenerator } from "~/features/contentModel/RefModelsGenerator/abstractions.js";

export interface GetModelArgs {
    modelId: string;
}

export const createGetModelResolver = () => {
    return async ({ args, context }: { args: GetModelArgs; context: CmsContext }) => {
        const { modelId } = args;

        try {
            const model = await getModel(context, modelId);
            const componentMapGenerator = context.container.resolve(ComponentMapGenerator);
            const valuesSelectionGenerator = context.container.resolve(ValuesSelectionGenerator);
            const refModelsGenerator = context.container.resolve(RefModelsGenerator);

            const componentMap = componentMapGenerator.generate(model);
            const valuesSelection = valuesSelectionGenerator.generate(model);
            const refModels = await refModelsGenerator.generate(model);

            return {
                data: {
                    name: model.name,
                    modelId: model.modelId,
                    singularApiName: model.singularApiName,
                    pluralApiName: model.pluralApiName,
                    description: model.description,
                    titleFieldId: model.titleFieldId,
                    descriptionFieldId: model.descriptionFieldId,
                    imageFieldId: model.imageFieldId,
                    fields: model.fields,
                    layout: model.layout,
                    tags: model.tags,
                    settings: model.settings,
                    componentMap,
                    metadata: {
                        valuesSelection,
                        refModels
                    }
                },
                error: null
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to get model"),
                    code: "GET_MODEL_ERROR"
                }
            };
        }
    };
};
