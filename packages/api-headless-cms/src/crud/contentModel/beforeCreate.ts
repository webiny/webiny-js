import WebinyError from "@webiny/error";
import camelCase from "lodash/camelCase";
import pluralize from "pluralize";
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

/**
 * Checks for the uniqueness of provided modelId, against the provided list of models.
 * It also takes plural / singular forms of the provided modelId into account.
 */
const checkModelIdUniqueness = (modelIdList: string[], modelId: string) => {
    if (modelIdList.includes(modelId) === true) {
        throw new WebinyError(
            `Content model with modelId "${modelId}" already exists.`,
            "MODEL_ID_EXISTS",
            {
                modelId
            }
        );
    }
    /**
     * Additionally, check if the plural form of the received modelId exists too. This prevents users
     * from creating, for example, "event" and "events" models, which would break the GraphQL schema.
     * 1. First check if user wants to create the "event" model, but the "events" model already exists.
     */
    const pluralizedModelIdCamelCase = pluralize(modelId);
    if (modelIdList.includes(pluralizedModelIdCamelCase) === true) {
        throw new WebinyError(
            `Content model with modelId "${modelId}" does not exist, but a model with modelId "${pluralizedModelIdCamelCase}" does.`,
            "MODEL_ID_PLURAL_ERROR",
            {
                modelId,
                plural: pluralizedModelIdCamelCase
            }
        );
    }

    /**
     * 2. Then check if user wants to create the "events" model, but the "event" model already exists.
     */
    const singularizedModelIdCamelCase = pluralize.singular(modelId);
    if (modelIdList.includes(singularizedModelIdCamelCase) === true) {
        throw new WebinyError(
            `Content model with modelId "${modelId}" does not exist, but a model with modelId "${singularizedModelIdCamelCase}" does.`,
            "MODEL_ID_SINGULAR_ERROR",
            {
                modelId,
                singular: singularizedModelIdCamelCase
            }
        );
    }
};

const checkModelIdAllowed = (modelId: string): void => {
    if (disallowedModelIdList.includes(modelId) === false) {
        return;
    }
    throw new WebinyError(`Provided model ID "${modelId}" is not allowed.`);
};

const checkModelIdEndingAllowed = (modelId: string): void => {
    for (const ending of disallowedModelIdEndingList) {
        const re = new RegExp(`${ending}$`, "i");
        const matched = modelId.match(re);
        if (matched === null) {
            continue;
        }
        throw new WebinyError(
            `ModelId that ends with "${ending}" is not allowed.`,
            "MODEL_ID_NOT_ALLOWED",
            {
                modelId
            }
        );
    }
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
        const { model } = params;

        const modelId = getModelId(model);

        const modelPlugin = plugins
            .byType<CmsModelPlugin>(CmsModelPlugin.type)
            .find((item: CmsModelPlugin) => item.contentModel.modelId === modelId);

        if (modelPlugin) {
            throw new WebinyError(
                `Cannot create "${model.modelId}" content model because one is already registered via a plugin.`,
                "CONTENT_MODEL_CREATE_ERROR",
                {
                    modelId: model.modelId
                }
            );
        }

        const models = await storageOperations.models.list({
            where: {
                tenant: model.tenant,
                locale: model.locale
            }
        });
        const modelIdList = models.map(m => m.modelId);

        /**
         * We need to check for:
         *  - is that exact modelId allowed
         *  - is modelId unique
         *  - is model ending allowed
         */
        checkModelIdAllowed(modelId);
        checkModelIdEndingAllowed(modelId);
        checkModelIdUniqueness(modelIdList, modelId);
        model.modelId = modelId;
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
        /**
         * and then we move onto model and fields...
         */
        await validateModel({
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
