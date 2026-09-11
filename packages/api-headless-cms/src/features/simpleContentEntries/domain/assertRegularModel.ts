import { SIMPLE_MODEL_TAG } from "~/features/simpleContentEntries/constants.js";
import { ModelIsSimpleError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Guards the regular entry operations against a simple model. Called from the mutating regular
 * repositories, the last layer before a storage operation stores the data.
 */
export const assertRegularModel = (model: CmsModel): void => {
    if (!model.tags?.includes(SIMPLE_MODEL_TAG)) {
        return;
    }
    throw new ModelIsSimpleError(model);
};
