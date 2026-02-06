import { getContext } from "~tests/converters/__helpers/context.js";
import { createValueKeyToStorageConverter } from "~/utils/converters/valueKeyToStorageConverter.js";
import { createValueKeyFromStorageConverter } from "~/utils/converters/valueKeyFromStorageConverter.js";
import type { CmsModel } from "~/types/index.js";

export interface IConvertersResponse {
    convertToStorage: ReturnType<typeof createValueKeyToStorageConverter>;
    convertFromStorage: ReturnType<typeof createValueKeyFromStorageConverter>;
}

export const getConverters = async (
    model: Pick<CmsModel, "fields">
): Promise<IConvertersResponse> => {
    const context = await getContext();
    const convertToStorage = createValueKeyToStorageConverter({
        model,
        plugins: context.plugins
    });

    const convertFromStorage = createValueKeyFromStorageConverter({
        model,
        plugins: context.plugins
    });
    return {
        convertToStorage,
        convertFromStorage
    };
};
