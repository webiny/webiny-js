import { createValueKeyToStorageConverter } from "~/utils/converters/valueKeyToStorageConverter.js";
import { createValueKeyFromStorageConverter } from "~/utils/converters/valueKeyFromStorageConverter.js";
import type { CmsModel } from "~/types/index.js";
import { usePlugins } from "~tests/testHelpers/usePlugins.js";

export interface IConvertersResponse {
    convertToStorage: ReturnType<typeof createValueKeyToStorageConverter>;
    convertFromStorage: ReturnType<typeof createValueKeyFromStorageConverter>;
}

export const getConverters = async (
    model: Pick<CmsModel, "fields">
): Promise<IConvertersResponse> => {
    const plugins = usePlugins();
    const convertToStorage = createValueKeyToStorageConverter({
        model,
        plugins
    });

    const convertFromStorage = createValueKeyFromStorageConverter({
        model,
        plugins
    });
    return {
        convertToStorage,
        convertFromStorage
    };
};
