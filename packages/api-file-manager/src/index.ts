import { ContextPlugin } from "@webiny/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FileModel as FileModelAbstraction } from "~/domain/file/abstractions.js";
import { FILE_MODEL_ID, FileModel } from "~/domain/file/file.model.js";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { createGraphQLSchemaPlugin } from "./graphql/index.js";

export * from "./delivery/index.js";
export * from "./modelModifier/CmsModelModifier.js";
//test2
export const createFileManagerContext = () => {
    const fileManagerContextPlugin = new ContextPlugin<ApiCoreContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        await context.security.withoutAuthorization(async () => {
            const fileModel = await getModel.execute(FILE_MODEL_ID);
            context.container.registerInstance(FileModelAbstraction, fileModel.value);
        });

        FmPermissionsFeature.register(context.container);
        FileManagerFeature.register(context.container);
    });

    fileManagerContextPlugin.name = "file-manager.createContext";

    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(FileModel);
    });

    return [fileManagerContextPlugin, modelsPlugin];
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};

export const createAssetDelivery = () => {
    return [
        createRegisterExtensionPlugin(context => {
            AssetDeliveryFeature.register(context.container);
        }),
        ...setupAssetDelivery()
    ];
};
