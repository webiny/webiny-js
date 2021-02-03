import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import camelCase from "lodash/camelCase";
import { runContentModelLifecycleHooks } from "./hooks";

const MAX_MODEL_ID_SEARCH_AMOUNT = 50;

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
        const modelIdCheck = `${modelIdCamelCase}${counter || ""}`;
        if (models.includes(modelIdCheck) === false) {
            return modelIdCheck;
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
        const modelIdCamelCase = camelCase(modelId);
        if (models.includes(modelIdCamelCase) === true) {
            throw Error(`Content model with modelId "${modelIdCamelCase}" already exists.`);
        }
        model.modelId = modelIdCamelCase;
    }
    // ... otherwise, assign a unique modelId automatically.
    else {
        model.modelId = await createNewModelId(context, models, model);
    }

    await runContentModelLifecycleHooks("beforeCreate", {
        context,
        model
    });
};
