import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel as FileModelAbstraction } from "~/domain/file/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileModel, FILE_MODEL_ID } from "~/domain/file/file.model.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";

export * from "./delivery/index.js";

export const createFileManagerContext = () => {
    const extensionPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(FileModel);
        FmPermissionsFeature.register(context.container);
        FileManagerFeature.register(context.container);
    });
    extensionPlugin.name = "file-manager.extension";

    const contextPlugin = new ContextPlugin<ApiCoreContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        await context.security.withoutAuthorization(async () => {
            const fileModel = await getModel.execute(FILE_MODEL_ID);
            context.container.registerInstance(FileModelAbstraction, fileModel.value);
        });
    });
    contextPlugin.name = "file-manager.createContext";

    return [extensionPlugin, contextPlugin];
};

export const createAssetDelivery = () => {
    return [
        createRegisterExtensionPlugin(context => {
            AssetDeliveryFeature.register(context.container);
        }),
        ...setupAssetDelivery()
    ];
};
