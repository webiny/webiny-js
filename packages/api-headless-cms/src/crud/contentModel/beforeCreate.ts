import WebinyError from "@webiny/error";
import camelCase from "lodash/camelCase";
import {
    CmsContext,
    CmsModel,
    HeadlessCmsStorageOperations,
    OnModelBeforeCreateFromTopicParams,
    OnModelBeforeCreateTopicParams
} from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { validateModel } from "./validateModel";
import { validateExistingModelId, validateModelIdAllowed } from "./validate/modelId";
import { validateSingularApiName } from "./validate/singularApiName";
import { validatePluralApiName } from "./validate/pluralApiName";
import { validateEndingAllowed } from "~/crud/contentModel/validate/endingAllowed";

const getModelId = (model: CmsModel): string => {
    const { modelId, name } = model;
    const value = modelId ? modelId.trim() : null;
    if (value) {
        const isModelIdValid = camelCase(value).toLowerCase() === value.toLowerCase();
        if (isModelIdValid) {
            return value;
        }
        return camelCase(value);
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

        validateModelIdAllowed({
            model: newModel
        });
        validateEndingAllowed({
            model: newModel
        });
        /**
         * We need to check for the existence of:
         * - modelId
         * - singularApiName
         * - pluralApiName
         */
        for (const model of models) {
            validateExistingModelId({
                existingModel: model,
                model: newModel
            });
            validateSingularApiName({
                existingModel: model,
                model: newModel
            });
            validatePluralApiName({
                existingModel: model,
                model: newModel
            });
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
         * Run the shared create/createFrom methods.
         */
        const cb = createOnModelBeforeCb({
            storageOperations,
            plugins: context.plugins
        });
        await cb({
            model,
            input
        });
        const models = await context.security.withoutAuthorization(async () => {
            return context.cms.listModels();
        });
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
