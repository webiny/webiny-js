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
import { NotAuthorizedError } from "@webiny/api-security";
import { FolderLevelPermissions } from "~/utils/FolderLevelPermissions";

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
        getIdentityTeam: () => new Promise(resolve => resolve(null)), // TODO: implement this
        listPermissions: () => security.listPermissions(),
        listAllFolders: type =>
            storageOperations
                .listFolders({ where: { type }, limit: 10000 })
                .then(result => result[0])
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

    context.aco = {
        folder: createFolderCrudMethods(params),
        search: createSearchRecordCrudMethods(params),
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

    // Overriding CRUD methods.
    const originalFmListFiles = context.fileManager.listFiles;
    context.fileManager.listFiles = async params => {
        const [allFolders] = await context.aco.folder.listAll({
            where: { type: "FmFile" }
        });

        return originalFmListFiles({
            ...params,
            where: {
                AND: [
                    params?.where || {},
                    {
                        location: {
                            // At the moment, all users can access files in the root folder.
                            // Folder level permissions cannot be set yet.
                            folderId_in: ["root", allFolders.map(folder => folder.id)]
                        }
                    }
                ]
            }
        });
    };

    const originalFmGetFile = context.fileManager.getFile;
    context.fileManager.getFile = async fileId => {
        const file = await originalFmGetFile(fileId);

        if (file && file.location.folderId !== "root") {
            const folder = await context.aco.folder.get(file.location.folderId);
            const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                folder,
                rwd: "r"
            });

            if (!canAccessFileFolder) {
                throw new NotAuthorizedError();
            }
        }

        return file;
    };

    const originalFmCreateFile = context.fileManager.createFile;
    context.fileManager.createFile = async params => {
        if (params.location?.folderId && params.location.folderId !== "root") {
            const folder = await context.aco.folder.get(params.location.folderId);
            const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                folder,
                rwd: "w"
            });

            if (!canAccessFileFolder) {
                throw new NotAuthorizedError();
            }
        }

        return originalFmCreateFile(params);
    };

    const originalFmUpdateFile = context.fileManager.updateFile;
    context.fileManager.updateFile = async (fileId, data) => {
        const file = await originalFmGetFile(fileId);

        if (file.location?.folderId && file.location.folderId !== "root") {
            const folder = await context.aco.folder.get(file.location.folderId);
            const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                folder,
                rwd: "w"
            });

            if (!canAccessFileFolder) {
                throw new NotAuthorizedError();
            }
        }

        return originalFmUpdateFile(fileId, data);
    };

    const originalFmDeleteFile = context.fileManager.deleteFile;
    context.fileManager.deleteFile = async fileId => {
        const file = await originalFmGetFile(fileId);

        if (file.location?.folderId && file.location.folderId !== "root") {
            const folder = await context.aco.folder.get(file.location.folderId);
            const canAccessFileFolder = await folderLevelPermissions.canAccessFolderContent({
                folder,
                rwd: "d"
            });

            if (!canAccessFileFolder) {
                throw new NotAuthorizedError();
            }
        }

        return originalFmDeleteFile(fileId);
    };
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
