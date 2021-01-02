import { CmsContentModelType, CmsContext } from "@webiny/api-headless-cms/types";
import camelCase from "lodash/camelCase";

const MAX_MODEL_ID_SEARCH_AMOUNT = 50;

type ArgsType = {
    context: CmsContext;
    model: CmsContentModelType;
};
export const beforeCreateHook = async (args: ArgsType) => {
    const { context, model } = args;
    const { name, modelId } = model;
    // If there is a modelId assigned, check if it's unique ...
    if (modelId) {
        const modelIdCamelCase = camelCase(modelId);
        const models = (await context.cms.models.list()).filter(model => {
            return model.modelId === modelIdCamelCase;
        });

        if (models.length === 0) {
            model.modelId = modelIdCamelCase;
            return;
        }
        throw Error(`Content model with modelId "${modelIdCamelCase}" already exists.`);
    }

    // ... otherwise, assign a unique modelId automatically.
    const modelIdCamelCase = camelCase(name);
    let counter = 0;

    while (true) {
        if (counter > MAX_MODEL_ID_SEARCH_AMOUNT) {
            throw new Error(
                `While loop reached #${MAX_MODEL_ID_SEARCH_AMOUNT} when checking for unique "modelId".`
            );
        }
        const modelIdCheck = `${modelIdCamelCase}${counter || ""}`;
        const models = (await context.cms.models.list()).filter(model => {
            return model.modelId === modelIdCheck;
        });
        if (models.length === 0) {
            model.modelId = modelIdCheck;
            return;
        }

        counter++;
    }
};
