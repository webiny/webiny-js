import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";

import { createContext } from "./context";
import { graphqlPlugins } from "./graphql";

import { SecurityIdentity } from "@webiny/api-security/types";
import { FoldersContext, FoldersStorageOperations } from "~/types";

export interface FoldersConfig {
    storageOperations: FoldersStorageOperations;
}

export const createFoldersContext = ({ storageOperations }: FoldersConfig) => {
    return new ContextPlugin<FoldersContext>(async context => {
        const getTenantId = (): string => {
            const tenant = context.tenancy.getCurrentTenant();
            if (!tenant) {
                throw new WebinyError("Missing tenant in API Folders.");
            }
            return tenant.id;
        };

        const getLocaleCode = (): string => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError("Missing content locale in API Folders.");
            }
            return locale.code;
        };

        const getIdentity = (): SecurityIdentity => {
            return context.security.getIdentity();
        };

        context.folders = await createContext({
            storageOperations,
            getTenantId,
            getLocaleCode,
            getIdentity
        });
    });
};

export const createFoldersGraphQL = () => {
    return new ContextPlugin<FoldersContext>(context => {
        context.plugins.register(graphqlPlugins);
    });
};
