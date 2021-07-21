import {
    CmsContentModel,
    CmsContentModelCreateHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsBeforeCreateArgs,
    CmsContext
} from "../../../../types";
import camelCase from "lodash/camelCase";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";
import pluralize from "pluralize";
import { ContentModelPlugin } from "~/content/plugins/ContentModelPlugin";
import WebinyError from "@webiny/error";

const MAX_MODEL_ID_SEARCH_AMOUNT = 50;

/**
 * Checks for the uniqueness of provided modelId, against the provided list of models.
 * It also takes plural / singular forms of the provided modelId into account.
 */
const checkModelIdUniqueness = (models: string[], modelId: string) => {
    if (models.includes(modelId) === true) {
        throw Error(`Content model with modelId "${modelId}" already exists.`);
    }

    // Additionally, check if the plural form of the received modelId exists too. This prevents users
    // from creating, for example, "event" and "events" models, which would break the GraphQL schema.

    // 1. First check if user wants to create the "event" model, but the "events" model already exists.
    const pluralizedModelIdCamelCase = pluralize(modelId);
    if (models.includes(pluralizedModelIdCamelCase) === true) {
        throw Error(
            `Content model with modelId "${modelId}" does not exist, but a model with modelId "${pluralizedModelIdCamelCase}" does.`
        );
    }

    // 2. Then check if user wants to create the "events" model, but the "event" model already exists.
    const singularizedModelIdCamelCase = pluralize.singular(modelId);
    if (models.includes(singularizedModelIdCamelCase) === true) {
        throw Error(
            `Content model with modelId "${modelId}" does not exist, but a model with modelId "${singularizedModelIdCamelCase}" does.`
        );
    }
};

/**
 * Also used to check uniqueness of the provided modelId, although this one just returns a simple boolean value.
 */
const isUniqueModelId = (models: string[], modelId: string) => {
    try {
        checkModelIdUniqueness(models, modelId);
        return true;
    } catch {
        // If an error has been thrown - we return false.
        return false;
    }
};

const DISALLOWED_MODEL_IDS = [
    "contentModel",
    "contentModels",
    "contentModelGroup",
    "contentModelGroups"
];

const checkModelIdAllowed = (modelId: string) => {
    if (DISALLOWED_MODEL_IDS.includes(modelId)) {
        throw new Error(`Provided model ID "${modelId}" is not allowed.`);
    }
};

const isAllowedModelId = (modelId: string) => {
    return !DISALLOWED_MODEL_IDS.includes(modelId);
};

const createNewModelId = (existingModels: string[], model: CmsContentModel): string => {
    const modelIdCamelCase = camelCase(model.name);
    let counter = 0;
    while (true) {
        if (counter > MAX_MODEL_ID_SEARCH_AMOUNT) {
            throw new Error(
                `While loop reached #${MAX_MODEL_ID_SEARCH_AMOUNT} when checking for unique "modelId".`
            );
        }

        // Let's try generating a new modelId and immediately check for its uniqueness.
        const generatedModelId = `${modelIdCamelCase}${counter || ""}`;
        if (
            isAllowedModelId(generatedModelId) &&
            isUniqueModelId(existingModels, generatedModelId)
        ) {
            return generatedModelId;
        }
        counter++;
    }
};

interface Args extends CmsContentModelStorageOperationsBeforeCreateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}

export const beforeCreateHook = async (args: Args): Promise<void> => {
    const { context, data, storageOperations, input } = args;
    const { modelId } = data;

    const modelPlugin: ContentModelPlugin = context.plugins
        .byType<ContentModelPlugin>(ContentModelPlugin.type)
        .find((item: ContentModelPlugin) => item.contentModel.modelId === modelId);

    if (modelPlugin) {
        throw new WebinyError(
            `Cannot create "${modelId}" content model because one is already registered via a plugin.`,
            "CONTENT_MODEL_CREATE_ERROR",
            {
                modelId
            }
        );
    }

    const models = (await storageOperations.list()).map(m => m.modelId);
    // If there is a modelId assigned, check if it's unique ...
    if (!!(modelId || "").trim()) {
        const modelIdCamelCase = camelCase(data.name);
        checkModelIdAllowed(modelIdCamelCase);
        checkModelIdUniqueness(models, modelIdCamelCase);
        data.modelId = modelIdCamelCase;
    } else {
        // ... otherwise, assign a unique modelId automatically.
        data.modelId = createNewModelId(models, data);
    }

    if (storageOperations.beforeCreate) {
        await storageOperations.beforeCreate(args);
    }
    await runContentModelLifecycleHooks<CmsContentModelCreateHookPluginArgs>("beforeCreate", {
        context,
        storageOperations,
        input,
        model: data
    });
};
