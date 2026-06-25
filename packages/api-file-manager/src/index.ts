import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel as FileModelAbstraction } from "~/domain/file/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FILE_MODEL_ID, FileModel } from "~/domain/file/file.model.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";

export const createFileManagerContext = () => {
    const extensionPlugin = createRegisterExtensionPlugin(context => {
        const container = context.container;
        container.register(FileModel);
        FmPermissionsFeature.register(container);
        FileManagerFeature.register(container);
    });
    extensionPlugin.name = "file-manager.extension";

    const contextPlugin = new ContextPlugin<ApiCoreContext>(async context => {
        const container = context.container;
        const tenantContext = container.resolve(TenantContext);
        const getModel = container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        await context.security.withoutAuthorization(async () => {
            const fileModel = await getModel.execute(FILE_MODEL_ID);
            container.registerInstance(FileModelAbstraction, fileModel.value);
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
