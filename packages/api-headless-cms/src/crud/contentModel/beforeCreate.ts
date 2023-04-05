import WebinyError from "@webiny/error";
import camelCase from "lodash/camelCase";
import {
    OnModelBeforeCreateFromTopicParams,
    OnModelBeforeCreateTopicParams,
    CmsModel,
    HeadlessCmsStorageOperations,
    CmsContext
} from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { validateModel } from "./validateModel";
import { validateLayout } from "./validateLayout";

const disallowedModelIdList: string[] = [
    "contentModel",
    "contentModels",
    "contentModelGroup",
    "contentModelGroups"
];
/**
 * This list is to disallow creating models that might interfere with GraphQL schema creation.
 * Add more if required.
 */
const disallowedModelIdEndingList: string[] = [
    "Response",
    "List",
    "Meta",
    "Input",
    "Sorter",
    "RefType"
];

const isModelIdAllowed = (modelId: string): boolean => {
    return disallowedModelIdList.includes(modelId) === false;
};

const isModelEndingAllowed = (apiName: string): boolean => {
    for (const ending of disallowedModelIdEndingList) {
        const re = new RegExp(`${ending}$`, "i");
        const matched = apiName.match(re);
        if (matched === null) {
            continue;
        }
        return false;
    }
    return true;
};

const getModelId = (model: CmsModel): string => {
    const { modelId, name } = model;
    if (!!modelId) {
        return camelCase(modelId.trim());
    } else if (name) {
        return camelCase(name.trim());
    }
    throw new WebinyError(
        `There is no "modelId" or "name" passed into the create model method.`,
        "MISSING_MODEL_DATA",
        {
            model
        }
    );
};

interface CreateOnModelBeforeCreateCbParams {
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}

const createOnModelBeforeCb = ({
    plugins,
    storageOperations
}: CreateOnModelBeforeCreateCbParams) => {
    return async (params: OnModelBeforeCreateTopicParams | OnModelBeforeCreateFromTopicParams) => {
        const { model: newModel } = params;

        const modelId = getModelId(newModel);

        newModel.modelId = modelId;

        const modelPlugin = plugins
            .byType<CmsModelPlugin>(CmsModelPlugin.type)
            .find((item: CmsModelPlugin) => item.contentModel.modelId === modelId);

        if (modelPlugin) {
            throw new WebinyError(
                `Cannot create "${newModel.modelId}" content model because one is already registered via a plugin.`,
                "CONTENT_MODEL_CREATE_ERROR",
                {
                    modelId: newModel.modelId
                }
            );
        }

        const models = await storageOperations.models.list({
            where: {
                tenant: newModel.tenant,
                locale: newModel.locale
            }
        });

        /**
         * We need to check for the existence of:
         * - modelId
         * - singularApiName
         * - pluralApiName
         */
        for (const model of models) {
            if (isModelIdAllowed(model.modelId) === false) {
                throw new WebinyError(
                    `Content model with modelId "${model.modelId}" is not allowed.`,
                    "MODEL_ID_NOT_ALLOWED",
                    {
                        modelId: model.modelId,
                        disallowed: disallowedModelIdList
                    }
                );
            } else if (model.modelId === newModel.modelId) {
                throw new WebinyError(
                    `Content model with modelId "${modelId}" already exists.`,
                    "MODEL_ID_EXISTS",
                    {
                        modelId: model.modelId
                    }
                );
            } else if (model.singularApiName === newModel.singularApiName) {
                throw new WebinyError(
                    `Content model with singularApiName "${newModel.singularApiName}" already exists.`,
                    "MODEL_SINGULAR_API_NAME_EXISTS",
                    {
                        existingSingularApiName: model.singularApiName,
                        singularApiName: newModel.singularApiName
                    }
                );
            } else if (model.pluralApiName === newModel.singularApiName) {
                throw new WebinyError(
                    `Content model with pluralApiName "${newModel.singularApiName}" already exists.`,
                    "MODEL_PLURAL_API_NAME_EXISTS",
                    {
                        existingPluralApiName: model.pluralApiName,
                        singularApiName: newModel.singularApiName
                    }
                );
            } else if (model.singularApiName === newModel.pluralApiName) {
                throw new WebinyError(
                    `Content model with singularApiName "${newModel.pluralApiName}" already exists.`,
                    "MODEL_SINGULAR_API_NAME_EXISTS",
                    {
                        existingSingularApiName: model.singularApiName,
                        pluralApiName: newModel.pluralApiName
                    }
                );
            } else if (model.pluralApiName === newModel.pluralApiName) {
                throw new WebinyError(
                    `Content model with pluralApiName "${newModel.pluralApiName}" already exists.`,
                    "MODEL_PLURAL_API_NAME_EXISTS",
                    {
                        existingPluralApiName: model.pluralApiName,
                        pluralApiName: newModel.pluralApiName
                    }
                );
            } else if (isModelEndingAllowed(newModel.singularApiName) === false) {
                throw new WebinyError(
                    `Content model with singularApiName "${newModel.singularApiName}" is not allowed.`,
                    "MODEL_SINGULAR_API_NAME_NOT_ALLOWED",
                    {
                        singularApiName: newModel.singularApiName,
                        disallowedEnding: disallowedModelIdEndingList
                    }
                );
            } else if (isModelEndingAllowed(newModel.pluralApiName) === false) {
                throw new WebinyError(
                    `Content model with singularApiName "${newModel.pluralApiName}" is not allowed.`,
                    "MODEL_PLURAL_API_NAME_NOT_ALLOWED",
                    {
                        pluralApiName: newModel.pluralApiName,
                        disallowedEnding: disallowedModelIdEndingList
                    }
                );
            }
        }
    };
};

interface AssignBeforeModelCreateParams {
    onModelBeforeCreate: Topic<OnModelBeforeCreateTopicParams>;
    onModelBeforeCreateFrom: Topic<OnModelBeforeCreateFromTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
}

/**
 * We attach both on before create and createFrom events here.
 * Callables are identical.
 */
export const assignModelBeforeCreate = (params: AssignBeforeModelCreateParams) => {
    const { onModelBeforeCreate, onModelBeforeCreateFrom, storageOperations, context } = params;

    onModelBeforeCreate.subscribe(async ({ model, input }) => {
        /**
         * First the layout...
         */
        validateLayout(model.layout, model.fields);
        /**
         * then we run the shared create/createFrom methods.
         */
        const cb = createOnModelBeforeCb({
            storageOperations,
            plugins: context.plugins
        });
        await cb({
            model,
            input
        });
        context.security.disableAuthorization();
        const models = await context.cms.listModels();
        context.security.enableAuthorization();
        /**
         * and then we move onto model and fields...
         */
        await validateModel({
            models,
            model,
            context
        });
    });

    onModelBeforeCreateFrom.subscribe(
        createOnModelBeforeCb({
            storageOperations,
            plugins: context.plugins
        })
    );
};
