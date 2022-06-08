import WebinyError from "@webiny/error";
import camelCase from "lodash/camelCase";
import pluralize from "pluralize";
import {
    BeforeModelCreateFromTopicParams,
    BeforeModelCreateTopicParams,
    CmsModel,
    HeadlessCmsStorageOperations
} from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModelPlugin } from "~/content/plugins/CmsModelPlugin";
import { validateModelFields } from "~/content/plugins/crud/contentModel/validateModelFields";

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

interface CreateOnBeforeCreateCbParams {
    plugins: PluginsContainer;
    storageOperations: HeadlessCmsStorageOperations;
}
const createOnBeforeCb = ({ plugins, storageOperations }: CreateOnBeforeCreateCbParams) => {
    return async (params: BeforeModelCreateTopicParams | BeforeModelCreateFromTopicParams) => {
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
    onBeforeModelCreate: Topic<BeforeModelCreateTopicParams>;
    onBeforeModelCreateFrom: Topic<BeforeModelCreateFromTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}

/**
 * We attach both on before create and createFrom events here.
 * Callables are identical.
 */
export const assignBeforeModelCreate = (params: AssignBeforeModelCreateParams) => {
    const { onBeforeModelCreate, onBeforeModelCreateFrom, storageOperations, plugins } = params;

    onBeforeModelCreate.subscribe(async ({ model, input }) => {
        /**
         * First we need to validate base data of the model.
         */
        const cb = createOnBeforeCb({
            storageOperations,
            plugins
        });
        await cb({
            model,
            input
        });
        /**
         * Then we move onto fields...
         */
        await validateModelFields({
            model,
            plugins
        });
    });

    onBeforeModelCreateFrom.subscribe(
        createOnBeforeCb({
            storageOperations,
            plugins
        })
    );
};
