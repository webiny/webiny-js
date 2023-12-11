import { ContextPlugin } from "@webiny/api";
import { FileManagerConfig } from "~/createFileManager";
import { FileManagerContext } from "~/types";
import { FileManagerContextSetup } from "./FileManagerContextSetup";
import { setupAssetDelivery, AssetDeliveryParams } from "./delivery/setupAssetDelivery";
import { createGraphQLSchemaPlugin } from "./graphql";
import { setupPrivateFiles } from "~/delivery/privateFiles";

export * from "./modelModifier/CmsModelModifier";
export * from "./plugins";
export * from "./delivery";

export const createFileManagerContext = ({
    storageOperations
}: Pick<FileManagerConfig, "storageOperations">) => {
    const plugin = new ContextPlugin<FileManagerContext>(async context => {
        const fmContext = new FileManagerContextSetup(context);
        context.fileManager = await fmContext.setupContext(storageOperations);
    });

    plugin.name = "file-manager.createContext";

    return plugin;
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};

export const createAssetDelivery = (config: AssetDeliveryParams) => {
    if (process.env.WEBINY_FUNCTION_TYPE === "asset-delivery") {
        return [setupAssetDelivery(config)];
    }
    return [setupPrivateFiles()];
};
