import type { ApiEndpoint, CmsContext } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { getModel, getErrorMessage } from "./helpers.js";
import { ComponentMapGenerator } from "~/features/contentModel/ComponentMapGenerator/abstractions.js";
import { ValuesSelectionGenerator } from "~/features/contentModel/ValuesSelectionGenerator/abstractions.js";
import { RefModelsGenerator } from "~/features/contentModel/RefModelsGenerator/abstractions.js";

export interface GetModelArgs {
    modelId: string;
}

const ENDPOINTS: ApiEndpoint[] = ["read", "preview", "manage"];

/**
 * Security: the proxy must respect the endpoint permissions, like the entry resolvers do via
 * `getExecutableSchema`. Model metadata is useful on any endpoint, so any of them is enough.
 */
const ensureCanAccessAnyEndpoint = async (context: CmsContext) => {
    for (const endpoint of ENDPOINTS) {
        const permission = await context.security.getPermission(`cms.endpoint.${endpoint}`);
        if (permission) {
            return;
        }
    }
    throw new NotAuthorizedError(`Not allowed to access CMS endpoints.`);
};

export const createGetModelResolver = () => {
    return async ({ args, context }: { args: GetModelArgs; context: CmsContext }) => {
        const { modelId } = args;

        try {
            await ensureCanAccessAnyEndpoint(context);
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
                    metadata: {
                        valuesSelection,
                        componentMap,
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
