import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { createAcoHooks } from "~/createAcoHooks";
import { createAcoStorageOperations } from "~/createAcoStorageOperations";
import { AcoContext, CreateAcoParams, Folder, IAcoAppRegisterParams } from "~/types";
import { createFolderCrudMethods } from "~/folder/folder.crud";
import { createSearchRecordCrudMethods } from "~/record/record.crud";
import { AcoApps } from "./apps";
import { SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { AcoAppRegisterPlugin } from "~/plugins";
import { FolderLevelPermissions } from "~/utils/FolderLevelPermissions";
import { CmsEntriesCrudDecorators } from "~/utils/decorators/CmsEntriesCrudDecorators";
import { FOLDER_MODEL_ID } from "~/folder/folder.model";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import { createFilterCrudMethods } from "~/filter/filter.crud";

interface CreateAcoContextParams {
    useFolderLevelPermissions?: boolean;
}

const setupAcoContext = async (
    context: AcoContext,
    setupAcoContextParams: CreateAcoContextParams
): Promise<void> => {
    const { tenancy, security, i18n } = context;

    const getLocale = (): I18NLocale => {
        const locale = i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing content locale in api-aco/plugins/context.ts",
                "LOCALE_ERROR"
            );
        }

        return locale;
    };

    const getTenant = (): Tenant => {
        return tenancy.getCurrentTenant();
    };

    const storageOperations = createAcoStorageOperations({
        /**
         * TODO: We need to figure out a way to pass "cms" from outside (e.g. apps/api/graphql)
         */
        cms: context.cms,
        /**
         * TODO: This is required for "entryFieldFromStorageTransform" which access plugins from context.
         */
        getCmsContext: () => context,
        security
    });

    const folderLevelPermissions = new FolderLevelPermissions({
        getIdentity: () => security.getIdentity(),
        listIdentityTeams: async () => {
            return security.withoutAuthorization(async () => {
                const identity = security.getIdentity();
                if (!identity) {
                    return [];
                }

                const adminUser = await context.adminUsers.getUser({ where: { id: identity.id } });
                if (!adminUser) {
                    return [];
                }

                const hasTeams = adminUser.teams && adminUser.teams.length > 0;
                if (hasTeams) {
                    return context.security.listTeams({ where: { id_in: adminUser.teams } });
                }

                return [];
            });
        },
        listPermissions: () => security.listPermissions(),
        listAllFolders: type => {
            // When retrieving a list of all folders, we want to do it in the
            // fastest way and that is by directly using CMS's storage operations.
            const { withModel } = createOperationsWrapper({
                modelName: FOLDER_MODEL_ID,
                cms: context.cms,
                getCmsContext: () => context,
                security
            });

            return withModel(async model => {
                try {
                    const results = await context.cms.storageOperations.entries.list(model, {
                        limit: 100_000,
                        where: {
                            type,

                            // Folders always work with latest entries. We never publish them.
                            latest: true
                        },
                        sort: ["title_ASC"]
                    });

                    return results.items.map(pickEntryFieldValues<Folder>);
                } catch (ex) {
                    /**
                     * Skip throwing an error if the error is related to the search phase execution.
                     * This is a temporary solution to avoid breaking the entire system when no entries were ever inserted in the index.
                     *
                     * TODO: figure out better way to handle this.
                     */
                    if (ex.message === "search_phase_execution_exception") {
                        return [];
                    }
                    throw ex;
                }
            });
        },
        canUseTeams: () => context.wcp.canUseTeams(),
        canUseFolderLevelPermissions: () => {
            if (setupAcoContextParams.useFolderLevelPermissions === false) {
                return false;
            }

            return context.wcp.canUseFolderLevelPermissions();
        },
        isAuthorizationEnabled: () => context.security.isAuthorizationEnabled()
    });

    const params: CreateAcoParams = {
        getLocale,
        getTenant,
        storageOperations,
        folderLevelPermissions
    };

    const defaultRecordModel = await context.security.withoutAuthorization(async () => {
        return context.cms.getModel(SEARCH_RECORD_MODEL_ID);
    });

    if (!defaultRecordModel) {
        throw new WebinyError(`There is no default record model in ${SEARCH_RECORD_MODEL_ID}`);
    }

    /**
     * First we need to create all the apps.
     */
    const apps = new AcoApps(context, params);
    const plugins = context.plugins.byType<AcoAppRegisterPlugin>(AcoAppRegisterPlugin.type);
    for (const plugin of plugins) {
        await apps.register({
            model: defaultRecordModel,
            ...plugin.app
        });
    }

    const listAdminUsers = () => {
        return security.withoutAuthorization(async () => {
            return context.adminUsers.listUsers();
        });
    };
    const listTeams = () => {
        return security.withoutAuthorization(async () => {
            return context.security.listTeams();
        });
    };

    context.aco = {
        folder: createFolderCrudMethods({
            ...params,
            listAdminUsers,
            listTeams
        }),
        search: createSearchRecordCrudMethods(params),
        folderLevelPermissions,
        filter: createFilterCrudMethods(params),
        apps,
        getApp: (name: string) => apps.get(name),
        listApps: () => apps.list(),
        registerApp: async (params: IAcoAppRegisterParams) => {
            return apps.register({
                model: defaultRecordModel,
                ...params
            });
        }
    };

    if (context.wcp.canUseFolderLevelPermissions()) {
        new CmsEntriesCrudDecorators({ context }).decorate();

        // PB decorators registered here: packages/api-page-builder-aco/src/index.ts
        // new PageBuilderCrudDecorators({ context }).decorate();
    }
};

export const createAcoContext = (params: CreateAcoContextParams = {}) => {
    const plugin = new ContextPlugin<AcoContext>(async context => {
        /**
         * We can skip the ACO initialization if the installation is pending.
         */
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        await context.benchmark.measure("aco.context.setup", async () => {
            await setupAcoContext(context, params);
        });

        await context.benchmark.measure("aco.context.hooks", async () => {
            await createAcoHooks(context);
        });
    });

    plugin.name = "aco.createContext";

    return plugin;
};
