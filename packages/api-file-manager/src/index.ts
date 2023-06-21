import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { SecurityPermission } from "@webiny/api-security/types";
import { FileManagerConfig, createFileManager } from "~/createFileManager";
import { FileManagerContext } from "~/types";
import { createGraphQLSchemaPlugin } from "./graphql";
import { FileStorage } from "~/storage/FileStorage";
import {FilesPermissions} from "~/createFileManager/permissions/FilesPermissions";

export * from "./plugins";

export const createFileManagerContext = (config: Pick<FileManagerConfig, "storageOperations">) => {
    return new ContextPlugin<FileManagerContext>(async context => {
        const getLocaleCode = () => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError(
                    "Missing locale on context.i18n locale in File Manager API.",
                    "LOCALE_ERROR"
                );
            }
            return locale.code;
        };

        const getIdentity = () => {
            return context.security.getIdentity();
        };

        const getTenantId = () => {
            return context.tenancy.getCurrentTenant().id;
        };

        const getPermissions = async <T extends SecurityPermission = SecurityPermission>(
            name: string
        ): Promise<T[]> => {
            return context.security.getPermissions(name);
        };

        if (config.storageOperations.beforeInit) {
            await config.storageOperations.beforeInit(context);
        }

        const filesPermissions = new FilesPermissions({
            getIdentity,
            getPermissions: () => getPermissions("fm.file"),
            fullAccessPermissionName: "fm.*"
        });

        context.fileManager = createFileManager({
            storageOperations: config.storageOperations,
            filesPermissions,
            getTenantId,
            getLocaleCode,
            getIdentity,
            getPermissions,
            storage: new FileStorage({
                context
            }),
            WEBINY_VERSION: context.WEBINY_VERSION
        });
    });
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};
