import { NotAuthorizedError } from "@webiny/api-security";
import { AcoContext } from "~/types";

interface EntryManagerCrudDecoratorsParams {
    context: AcoContext;
}

export class CmsEntriesCrudDecorators {
    private readonly context: AcoContext;

    // TODO: Not smart to pass the whole `context`. We probably want to refactor this.
    constructor({ context }: EntryManagerCrudDecoratorsParams) {
        this.context = context;
    }

    decorate() {
        const context = this.context;
        const folderLevelPermissions = context.aco.folderLevelPermissions;

        const originalCmsListEntries = context.cms.listEntries.bind(context.cms);
        context.cms.listEntries = async (model, params) => {
            const hasLocationField = model.modelId !== "apwReviewerModelDefinition";
            if (!hasLocationField) {
                return originalCmsListEntries(model, params);
            }

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
                        folderId_in: ["root", ...allFolders.map(folder => folder.id)]
                    }
                }
            });
        };

        const originalCmsGetEntry = context.cms.getEntry.bind(context.cms);
        context.cms.getEntry = async (model, params) => {
            const entry = await originalCmsGetEntry(model, params);

            const folderId = entry?.location?.folderId;
            if (folderId && folderId !== "root") {
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "r"
                });
            }

            return entry;
        };

        const originalCmsGetEntryById = context.cms.getEntryById.bind(context.cms);
        context.cms.getEntryById = async (model, params) => {
            const entry = await originalCmsGetEntryById(model, params);

            const folderId = entry?.location?.folderId;
            if (folderId && folderId !== "root") {
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "r"
                });
            }

            return entry;
        };

        const originalGetLatestEntriesByIds = context.cms.getLatestEntriesByIds.bind(context.cms);
        context.cms.getLatestEntriesByIds = async (model, ids) => {
            const entriesByIds = await originalGetLatestEntriesByIds(model, ids);
            const returnEntriesByIds: typeof entriesByIds = [];

            for (let i = 0; i < entriesByIds.length; i++) {
                const entry = entriesByIds[i];

                const folderId = entry?.location?.folderId;
                if (folderId && folderId !== "root") {
                    try {
                        // Getting the folder can also throw an error if user does not have access.
                        const folder = await context.aco.folder.get(folderId);
                        await folderLevelPermissions.ensureCanAccessFolderContent({
                            folder,
                            rwd: "r"
                        });

                        returnEntriesByIds.push(entry);
                    } catch (e) {
                        if (e instanceof NotAuthorizedError) {
                            continue;
                        }
                        throw e;
                    }
                }
            }

            return returnEntriesByIds;
        };

        const originalGetPublishedEntriesByIds = context.cms.getPublishedEntriesByIds.bind(
            context.cms
        );
        context.cms.getPublishedEntriesByIds = async (model, ids) => {
            const entriesByIds = await originalGetPublishedEntriesByIds(model, ids);
            const returnEntriesByIds: typeof entriesByIds = [];

            for (let i = 0; i < entriesByIds.length; i++) {
                const entry = entriesByIds[i];

                const folderId = entry?.location?.folderId;
                if (folderId && folderId !== "root") {
                    try {
                        // Getting the folder can also throw an error if user does not have access.
                        const folder = await context.aco.folder.get(folderId);
                        await folderLevelPermissions.ensureCanAccessFolderContent({
                            folder,
                            rwd: "r"
                        });

                        returnEntriesByIds.push(entry);
                    } catch (e) {
                        if (e instanceof NotAuthorizedError) {
                            continue;
                        }
                        throw e;
                    }
                }
            }

            return returnEntriesByIds;
        };

        const originalCmsCreateEntry = context.cms.createEntry.bind(context.cms);
        context.cms.createEntry = async (model, params) => {
            const folderId = params.wbyAco_location?.folderId || params.location?.folderId;
            if (folderId && folderId !== "root") {
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });
            }

            return originalCmsCreateEntry(model, params);
        };

        const originalCmsUpdateEntry = context.cms.updateEntry.bind(context.cms);
        context.cms.updateEntry = async (model, id, input, meta) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            // const entry = await originalCmsGetEntry(model, { where: { id } });

            const folderId = entry?.location?.folderId;
            if (folderId && folderId !== "root") {
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });
            }

            return originalCmsUpdateEntry(model, id, input, meta);
        };

        const originalCmsDeleteEntry = context.cms.deleteEntry.bind(context.cms);
        context.cms.deleteEntry = async (model, id) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (folderId && folderId !== "root") {
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "d"
                });
            }

            return originalCmsDeleteEntry(model, id);
        };

        const originalCmsDeleteEntryRevision = context.cms.deleteEntryRevision.bind(context.cms);
        context.cms.deleteEntryRevision = async (model, id) => {
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (folderId && folderId !== "root") {
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "d"
                });
            }

            return originalCmsDeleteEntryRevision(model, id);
        };
    }
}
