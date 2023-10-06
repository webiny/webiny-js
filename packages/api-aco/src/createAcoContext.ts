import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { createAcoHooks } from "~/createAcoHooks";
import { createAcoStorageOperations } from "~/createAcoStorageOperations";
import { isInstallationPending } from "~/utils/isInstallationPending";
import { AcoContext, CreateAcoParams, IAcoAppRegisterParams } from "~/types";
import { createFolderCrudMethods } from "~/folder/folder.crud";
import { createSearchRecordCrudMethods } from "~/record/record.crud";
import { AcoApps } from "./apps";
import { SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { AcoAppRegisterPlugin } from "~/plugins";
import { FolderLevelPermissions } from "~/utils/FolderLevelPermissions";
import { FileManagerCrudDecorators } from "~/utils/decorators/FileManagerCrudDecorators";

const setupAcoContext = async (context: AcoContext): Promise<void> => {
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
        getIdentityTeam: async () => {
            const identity = security.getIdentity();
            const adminUser = await context.adminUsers.getUser({ where: { id: identity.id } });
            if (!adminUser) {
                return null;
            }

            if (!adminUser.team) {
                return null;
            }

            return context.security.getTeam({ where: { id: adminUser.team } });

        },
        listPermissions: () => security.listPermissions(),
        listAllFolders: type =>
            storageOperations
                .listFolders({ where: { type }, limit: 10000 })
                .then(result => result[0]),
        canUseTeams: () => context.wcp.canUseTeams(),
        canUseFolderLevelPermissions: () => context.wcp.canUseFolderLevelPermissions()
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

    const listAdminUsers = () => context.adminUsers.listUsers();
    const listTeams = () => context.security.listTeams();

    context.aco = {
        folder: createFolderCrudMethods({
            ...params,
            listAdminUsers,
            listTeams
        }),
        search: createSearchRecordCrudMethods(params),
        folderLevelPermissions,
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

    // Decorating CRUD methods.
    new FileManagerCrudDecorators({ context }).decorate();

    // new HeadlessCmsCrudDecorators({ context }).decorate();
    // new PageBuilderCrudDecorators({ context }).decorate();
};

export const createAcoContext = () => {
    const plugin = new ContextPlugin<AcoContext>(async context => {
        /**
         * We can skip the ACO initialization if the installation is pending.
         */
        if (isInstallationPending(context)) {
            return;
        }
        await context.benchmark.measure("aco.context.setup", async () => {
            await setupAcoContext(context);
        });

        await context.benchmark.measure("aco.context.hooks", async () => {
            await createAcoHooks(context);
        });
    });

    plugin.name = "aco.createContext";

    return plugin;
};
