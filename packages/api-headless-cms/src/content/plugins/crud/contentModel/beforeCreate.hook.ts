import { CmsContentModel, CmsContext } from "../../../../types";
import camelCase from "lodash/camelCase";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";
import pluralize from "pluralize";

const MAX_MODEL_ID_SEARCH_AMOUNT = 50;

/**
 * Checks for the uniqueness of provided modelId, against the provided list of models.
 * It also takes plural / singular forms of the provided modelId into account.
 * @param models
 * @param modelId
 */
const checkModelIdUniqueness = (models, modelId) => {
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
 * @param models
 * @param modelId
 */
const isUniqueModelId = (models, modelId) => {
    try {
        checkModelIdUniqueness(models, modelId);
        return true;
    } catch {
        // If an error has been thrown - we return false.
        return false;
    }
};

const createNewModelId = async (
    context: CmsContext,
    models: string[],
    model: CmsContentModel
): Promise<string> => {
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
        if (isUniqueModelId(models, generatedModelId)) {
            return generatedModelId;
        }
        counter++;
    }
};

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}

export const beforeCreateHook = async (args: Args): Promise<void> => {
    const { context, model } = args;
    const { modelId } = model;
    const models = (await context.cms.models.noAuth().list()).map(m => m.modelId);
    // If there is a modelId assigned, check if it's unique ...
    if (modelId) {
        const modelIdCamelCase = camelCase(model.name);
        checkModelIdUniqueness(models, modelIdCamelCase);
        model.modelId = modelIdCamelCase;
    } else {
        // ... otherwise, assign a unique modelId automatically.
        model.modelId = await createNewModelId(context, models, model);
    }

    await runContentModelLifecycleHooks("beforeCreate", {
        context,
        model
    });
};
