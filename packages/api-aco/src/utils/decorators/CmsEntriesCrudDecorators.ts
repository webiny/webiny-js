import { AcoContext } from "~/types";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { FolderLevelPermissions } from "~/utils/FolderLevelPermissions";

type Context = Pick<AcoContext, "aco" | "cms">;

const ROOT_FOLDER = "root";

const createFolderType = (model: Pick<CmsModel, "modelId">): string => {
    return `cms:${model.modelId}`;
};

const filterEntriesByFolderFactory = (context: Context, permissions: FolderLevelPermissions) => {
    return async (model: CmsModel, entries: CmsEntry[]) => {
        const [folders] = await context.aco.folder.listAll({
            where: {
                type: createFolderType(model)
            }
        });

        const results = await Promise.all(
            entries.map(async entry => {
                const folderId = entry.location?.folderId;
                if (!folderId || folderId === ROOT_FOLDER) {
                    return entry;
                }
                const folder = folders.find(folder => folder.id === folderId);
                if (!folder) {
                    throw new NotFoundError(`Folder "${folderId}" not found.`);
                }
                const result = await permissions.canAccessFolderContent({
                    folder,
                    rwd: "r"
                });
                return result ? entry : null;
            })
        );

        return results.filter((entry): entry is CmsEntry => !!entry);
    };
};

interface EntryManagerCrudDecoratorsParams {
    context: Context;
}

export class CmsEntriesCrudDecorators {
    private readonly context: Context;

    public constructor({ context }: EntryManagerCrudDecoratorsParams) {
        this.context = context;
    }

    public decorate() {
        const context = this.context;
        const folderLevelPermissions = context.aco.folderLevelPermissions;

        const filterEntriesByFolder = filterEntriesByFolderFactory(context, folderLevelPermissions);

        const originalCmsListEntries = context.cms.listEntries.bind(context.cms);
        context.cms.listEntries = async (model, params) => {
            const folderType = model.modelId === "fmFile" ? "FmFile" : `cms:${model.modelId}`;
            const allFolders = await folderLevelPermissions.listAllFoldersWithPermissions(
                folderType
            );

            return originalCmsListEntries(model, {
                ...params,
                where: {
                    ...(params?.where || {}),
                    wbyAco_location: {
                        // At the moment, all users can access entries in the root folder.
                        // Root folder level permissions cannot be set yet.
                        folderId_in: [ROOT_FOLDER, ...allFolders.map(folder => folder.id)]
                    }
                }
            });
        };

        const originalCmsGetEntry = context.cms.getEntry.bind(context.cms);
        context.cms.getEntry = async (model, params) => {
            const entry = await originalCmsGetEntry(model, params);

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return entry;
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "r"
            });

            return entry;
        };

        const originalCmsGetEntryById = context.cms.getEntryById.bind(context.cms);
        context.cms.getEntryById = async (model, params) => {
            const entry = await originalCmsGetEntryById(model, params);

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return entry;
            }
            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "r"
            });
            return entry;
        };

        const originalGetLatestEntriesByIds = context.cms.getLatestEntriesByIds.bind(context.cms);
        context.cms.getLatestEntriesByIds = async (model, ids) => {
            const entries = await originalGetLatestEntriesByIds(model, ids);

            return filterEntriesByFolder(model, entries);
        };

        const originalGetPublishedEntriesByIds = context.cms.getPublishedEntriesByIds.bind(
            context.cms
        );
        context.cms.getPublishedEntriesByIds = async (model, ids) => {
            const entries = await originalGetPublishedEntriesByIds(model, ids);
            return filterEntriesByFolder(model, entries);
        };

        const originalCmsCreateEntry = context.cms.createEntry.bind(context.cms);
        context.cms.createEntry = async (model, params, options) => {
            const folderId = params.wbyAco_location?.folderId || params.location?.folderId;

            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsCreateEntry(model, params, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsCreateEntry(model, params, options);
        };

        const originalCmsCreateFromEntry = context.cms.createEntryRevisionFrom.bind(context.cms);
        context.cms.createEntryRevisionFrom = async (model, id, input, options) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsCreateFromEntry(model, id, input, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsCreateFromEntry(model, id, input, options);
        };

        const originalCmsUpdateEntry = context.cms.updateEntry.bind(context.cms);
        context.cms.updateEntry = async (model, id, input, meta, options) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsUpdateEntry(model, id, input, meta, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsUpdateEntry(model, id, input, meta, options);
        };

        const originalCmsDeleteEntry = context.cms.deleteEntry.bind(context.cms);
        context.cms.deleteEntry = async (model, id, options) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsDeleteEntry(model, id, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "d"
            });

            return originalCmsDeleteEntry(model, id, options);
        };

        const originalCmsDeleteEntryRevision = context.cms.deleteEntryRevision.bind(context.cms);
        context.cms.deleteEntryRevision = async (model, id) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsDeleteEntryRevision(model, id);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "d"
            });

            return originalCmsDeleteEntryRevision(model, id);
        };

        const originalCmsMoveEntry = context.cms.moveEntry.bind(context.cms);
        context.cms.moveEntry = async (model, id, targetFolderId) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsMoveEntry(model, id, targetFolderId);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsMoveEntry(model, id, targetFolderId);
        };
    }
}
