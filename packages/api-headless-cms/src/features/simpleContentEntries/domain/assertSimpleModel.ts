import { SIMPLE_MODEL_TAG } from "~/features/simpleContentEntries/constants.js";
import { ModelNotSimpleError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Guards the simple entry operations against a regular model. Called from the simple
 * repositories, the last layer before a storage operation stores the data.
 */
export const assertSimpleModel = (model: CmsModel): void => {
    if (model.tags?.includes(SIMPLE_MODEL_TAG)) {
        return;
    }
    throw new ModelNotSimpleError(model);
};
