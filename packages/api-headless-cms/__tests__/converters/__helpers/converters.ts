import { createValueKeyToStorageConverter } from "~/utils/converters/valueKeyToStorageConverter.js";
import { createValueKeyFromStorageConverter } from "~/utils/converters/valueKeyFromStorageConverter.js";
import type { CmsModel } from "~/types/index.js";
import { usePlugins } from "~tests/testHelpers/usePlugins.js";
import { Context } from "@webiny/api";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModelFieldToGraphQLRegistry, GraphQLFeature } from "~/features/graphql/index.js";

export interface IConvertersResponse {
    convertToStorage: ReturnType<typeof createValueKeyToStorageConverter>;
    convertFromStorage: ReturnType<typeof createValueKeyFromStorageConverter>;
}

const createFieldRegistry = (plugins: PluginsContainer) => {
    const context = new Context({
        WEBINY_VERSION: "0.0.0",
        plugins
    });
    GraphQLFeature.register(context.container);
    return context.container.resolve(CmsModelFieldToGraphQLRegistry);
};

export const getConverters = async (
    model: Pick<CmsModel, "fields">
): Promise<IConvertersResponse> => {
    const plugins = usePlugins();
    const fieldRegistry = createFieldRegistry(plugins);

    const convertToStorage = createValueKeyToStorageConverter({
        model,
        plugins,
        fieldRegistry
    });

    const convertFromStorage = createValueKeyFromStorageConverter({
        model,
        plugins,
        fieldRegistry
    });
    return {
        convertToStorage,
        convertFromStorage
    };
};
