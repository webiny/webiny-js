import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { FilePermission, SettingsPermission } from "~/types.js";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { createGraphQLSchemaPlugin } from "./graphql/index.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FilesPermissions as FilePermissionsImpl } from "~/permissions/FilesPermissions.js";
import { SettingsPermissions as SettingsPermissionsImpl } from "~/permissions/SettingsPermissions.js";
import { FilePermissions, SettingsPermissions } from "~/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel as FileModelAbstraction } from "~/domain/file/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileModel, FILE_MODEL_ID } from "~/domain/file/file.model.js";

export * from "./modelModifier/CmsModelModifier.js";
export * from "./delivery/index.js";

export const createFileManagerContext = () => {
    const plugin = new ContextPlugin<ApiCoreContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        context.container.register(FileModel);

        await context.security.withoutAuthorization(async () => {
            const fileModel = await getModel.execute(FILE_MODEL_ID);
            context.container.registerInstance(FileModelAbstraction, fileModel.value);
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

export const createAssetDelivery = () => {
    return setupAssetDelivery();
};
