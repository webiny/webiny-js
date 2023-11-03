import { AcoContext } from "~/types";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { FolderLevelPermissions } from "~/utils/FolderLevelPermissions";
import { createWhere } from "./where";
import { ROOT_FOLDER } from "./constants";

type Context = Pick<AcoContext, "aco" | "cms">;
/**
 * Keep this until we figure out how to fetch the folders.
 */
const isPageModel = (model: CmsModel): boolean => {
    if (model.modelId === "pbPage") {
        return true;
    } else if (model.modelId === "acoSearchRecord-pbpage") {
        return true;
    }
    return false;
};

const createFolderType = (model: CmsModel): "FmFile" | "PbPage" | `cms:${string}` => {
    if (model.modelId === "fmFile") {
        return "FmFile";
    } else if (isPageModel(model)) {
        return "PbPage";
    }
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
            const folderType = createFolderType(model);
            const folders = await folderLevelPermissions.listAllFoldersWithPermissions(folderType);

            const where = createWhere({
                where: params.where,
                folders
            });
            return originalCmsListEntries(model, {
                ...params,
                where
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
            /**
             * First we need to check if user has access to the entries existing folder.
             */
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });
            const folderId = entry?.location?.folderId || ROOT_FOLDER;
            /**
             * If the entry is in the same folder we are trying to move it to, just continue.
             */
            if (folderId === targetFolderId) {
                return originalCmsMoveEntry(model, id, targetFolderId);
            } else if (folderId !== ROOT_FOLDER) {
                /**
                 * If entry current folder is not a root, check for access
                 */
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });
            }
            /**
             * If target folder is not a ROOT_FOLDER, check for access.
             */
            if (targetFolderId !== ROOT_FOLDER) {
                const folder = await context.aco.folder.get(targetFolderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });
            }

            return originalCmsMoveEntry(model, id, targetFolderId);
        };
    }
}
