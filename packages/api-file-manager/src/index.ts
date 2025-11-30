import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { FilePermission, SettingsPermission } from "~/types.js";
import type { AssetDeliveryParams } from "./delivery/setupAssetDelivery.js";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { createGraphQLSchemaPlugin } from "./graphql/index.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FilesPermissions as FilePermissionsImpl } from "~/permissions/FilesPermissions.js";
import { SettingsPermissions as SettingsPermissionsImpl } from "~/permissions/SettingsPermissions.js";
import { FilePermissions, SettingsPermissions } from "~/features/shared/abstractions.js";
import { createFileModel, FILE_MODEL_ID } from "~/domain/file/fileModel.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel } from "~/domain/file/abstractions.js";

export * from "./modelModifier/CmsModelModifier.js";
export * from "./delivery/index.js";

export const createFileManagerContext = () => {
    const plugin = new ContextPlugin<ApiCoreContext>(async context => {
        const getModel = context.container.resolve(GetModelUseCase);
        const wcpContext = context.container.resolve(WcpContext);
        const withPrivateFiles = wcpContext.canUsePrivateFiles();

        const fileModelDefinition = createFileModel({ withPrivateFiles });
        context.plugins.register(fileModelDefinition);

        await context.security.withoutAuthorization(async () => {
            const fileModel = await getModel.execute(FILE_MODEL_ID);
            context.container.registerInstance(FileModel, fileModel.value);
        });

        const identityContext = context.container.resolve(IdentityContext);

        const filePermissions = new FilePermissionsImpl({
            getIdentity: () => identityContext.getIdentity(),
            getPermissions: () => identityContext.getPermissions<FilePermission>("fm.file"),
            fullAccessPermissionName: "fm.*"
        });

        const settingsPermissions = new SettingsPermissionsImpl({
            getIdentity: () => identityContext.getIdentity(),
            getPermissions: () => identityContext.getPermissions<SettingsPermission>("fm.settings"),
            fullAccessPermissionName: "fm.*"
        });

        context.container.registerInstance(FilePermissions, filePermissions);
        context.container.registerInstance(SettingsPermissions, settingsPermissions);

        FileManagerFeature.register(context.container);
    });

    plugin.name = "file-manager.createContext";

    return plugin;
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};

export const createAssetDelivery = (config: AssetDeliveryParams) => {
    return setupAssetDelivery(config);
};
