import { AcoContext } from "~/types";
import { createWhere } from "./where";
import { ROOT_FOLDER } from "./constants";
import { filterEntriesByFolderFactory } from "./filterEntriesByFolderFactory";
import { createFolderType } from "./createFolderType";
import { decorateIfModelAuthorizationEnabled } from "./decorateIfModelAuthorizationEnabled";

type Context = Pick<AcoContext, "aco" | "cms">;

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

        decorateIfModelAuthorizationEnabled(context.cms, "listEntries", async (...allParams) => {
            const [decoratee, model, params] = allParams;
            const folderType = createFolderType(model);
            const folders = await folderLevelPermissions.listAllFoldersWithPermissions(folderType);

            const where = createWhere({
                model,
                where: params.where,
                folders
            });
            return decoratee(model, {
                ...params,
                where
            });
        });

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "listLatestEntries",
            async (...allParams) => {
                const [decoratee, model, params] = allParams;
                const folderType = createFolderType(model);
                const folders = await folderLevelPermissions.listAllFoldersWithPermissions(
                    folderType
                );

                const where = createWhere({
                    model,
                    where: params?.where || {},
                    folders
                });
                return decoratee(model, {
                    ...params,
                    where
                });
            }
        );

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "listPublishedEntries",
            async (...allParams) => {
                const [decoratee, model, params] = allParams;
                const folderType = createFolderType(model);
                const folders = await folderLevelPermissions.listAllFoldersWithPermissions(
                    folderType
                );

                const where = createWhere({
                    model,
                    where: params?.where || {},
                    folders
                });
                return decoratee(model, {
                    ...params,
                    where
                });
            }
        );

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "listDeletedEntries",
            async (...allParams) => {
                const [decoratee, model, params] = allParams;
                const folderType = createFolderType(model);
                const folders = await folderLevelPermissions.listAllFoldersWithPermissions(
                    folderType
                );

                const where = createWhere({
                    model,
                    where: params?.where || {},
                    folders
                });
                return decoratee(model, {
                    ...params,
                    where
                });
            }
        );

        decorateIfModelAuthorizationEnabled(context.cms, "getEntry", async (...allParams) => {
            const [decoratee, model, params] = allParams;
            const entry = await decoratee(model, params);

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
        });

        decorateIfModelAuthorizationEnabled(context.cms, "getEntryById", async (...allParams) => {
            const [decoratee, model, params] = allParams;
            const entry = await decoratee(model, params);

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
        });

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "getLatestEntriesByIds",
            async (...allParams) => {
                const [decoratee, model, ids] = allParams;

                const entries = await decoratee(model, ids);

                return filterEntriesByFolder(model, entries);
            }
        );

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "getPublishedEntriesByIds",
            async (...allParams) => {
                const [decoratee, model, ids] = allParams;

                const entries = await decoratee(model, ids);
                return filterEntriesByFolder(model, entries);
            }
        );

        decorateIfModelAuthorizationEnabled(context.cms, "createEntry", async (...allParams) => {
            const [decoratee, model, params, options] = allParams;

            const folderId = params.wbyAco_location?.folderId || params.location?.folderId;

            if (!folderId || folderId === ROOT_FOLDER) {
                return decoratee(model, params, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return decoratee(model, params, options);
        });

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "createEntryRevisionFrom",
            async (...allParams) => {
                const [decoratee, model, id, input, options] = allParams;

                const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                    id
                });

                const folderId = entry?.location?.folderId;
                if (!folderId || folderId === ROOT_FOLDER) {
                    return decoratee(model, id, input, options);
                }

                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });

                return decoratee(model, id, input, options);
            }
        );

        decorateIfModelAuthorizationEnabled(context.cms, "updateEntry", async (...allParams) => {
            const [decoratee, model, id, input, meta, options] = allParams;
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return decoratee(model, id, input, meta, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return decoratee(model, id, input, meta, options);
        });

        decorateIfModelAuthorizationEnabled(context.cms, "deleteEntry", async (...allParams) => {
            const [decoratee, model, id, options] = allParams;

            const entry = await context.cms.storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    id
                }
            );

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return decoratee(model, id, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "d"
            });

            return decoratee(model, id, options);
        });

        decorateIfModelAuthorizationEnabled(
            context.cms,
            "deleteEntryRevision",
            async (...allParams) => {
                const [decoratee, model, id] = allParams;

                const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                    id
                });

                const folderId = entry?.location?.folderId;
                if (!folderId || folderId === ROOT_FOLDER) {
                    return decoratee(model, id);
                }

                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "d"
                });

                return decoratee(model, id);
            }
        );

        decorateIfModelAuthorizationEnabled(context.cms, "moveEntry", async (...allParams) => {
            const [decoratee, model, id, targetFolderId] = allParams;

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
                return decoratee(model, id, targetFolderId);
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

            return decoratee(model, id, targetFolderId);
        });
    }
}
