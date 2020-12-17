import { CmsContentModelType, CmsContext } from "@webiny/api-headless-cms/types";
import camelCase from "lodash/camelCase";

const MAX_MODEL_ID_SEARCH_AMOUNT = 50;

export const beforeCreateHook = async (context: CmsContext, model: CmsContentModelType) => {
    const { name, modelId } = model;
    // If there is a modelId assigned, check if it's unique ...
    if (modelId) {
        const models = await context.cms.models.list({
            where: {
                modelId: camelCase(modelId)
            },
            limit: 1
        });

        if (models.length === 0) {
            return;
        }
        throw Error(`Content model with modelId "${modelId}" already exists.`);
    }

    // ... otherwise, assign a unique modelId automatically.
    const modelIdCamelCase = camelCase(name);
    let counter = 0;

    while (true) {
        if (counter > MAX_MODEL_ID_SEARCH_AMOUNT) {
            throw new Error(`While loop reached ${MAX_MODEL_ID_SEARCH_AMOUNT}`);
        }
        const modelIdCheck = `${modelIdCamelCase}${counter || ""}`;
        const models = await context.cms.models.list({
            where: {
                modelId: modelIdCheck
            },
            limit: 1
        });
        if (models.length === 0) {
            model.modelId = modelIdCheck;
            return;
        }

        counter++;
    }
};
