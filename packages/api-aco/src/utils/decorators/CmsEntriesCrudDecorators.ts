import type { AcoContext } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";
import { ListEntriesFactory } from "./ListEntriesFactory.js";
import { FilterEntriesByFolderFactory } from "./FilterEntriesByFolderFactory.js";
import { decorateIfModelAuthorizationEnabled } from "./decorateIfModelAuthorizationEnabled.js";

type Context = AcoContext;

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

        const filterEntriesByFolder = new FilterEntriesByFolderFactory(folderLevelPermissions);
        const listEntriesHandler = new ListEntriesFactory(folderLevelPermissions);

        decorateIfModelAuthorizationEnabled(context, "listEntries", async (...allParams) => {
            const [decoratee, model, initialParams] = allParams;
            return await listEntriesHandler.execute({ decoratee, model, initialParams });
        });

        decorateIfModelAuthorizationEnabled(context, "listLatestEntries", async (...allParams) => {
            const [decoratee, model, initialParams] = allParams;
            return await listEntriesHandler.execute({ decoratee, model, initialParams });
        });

        decorateIfModelAuthorizationEnabled(
            context,
            "listPublishedEntries",
            async (...allParams) => {
                const [decoratee, model, initialParams] = allParams;
                return await listEntriesHandler.execute({ decoratee, model, initialParams });
            }
        );

        decorateIfModelAuthorizationEnabled(context, "listDeletedEntries", async (...allParams) => {
            const [decoratee, model, initialParams] = allParams;
            return await listEntriesHandler.execute({ decoratee, model, initialParams });
        });

        decorateIfModelAuthorizationEnabled(context, "getEntry", async (...allParams) => {
            const [decoratee, model, params] = allParams;
            const entry = await decoratee(model, params);

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return entry;
            }

            const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                permissions,
                rwd: "r"
            });

            return entry;
        });

        decorateIfModelAuthorizationEnabled(context, "getEntryById", async (...allParams) => {
            const [decoratee, model, params] = allParams;
            const entry = await decoratee(model, params);

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return entry;
            }
            const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                permissions,
                rwd: "r"
            });
            return entry;
        });

        decorateIfModelAuthorizationEnabled(
            context,
            "getLatestEntriesByIds",
            async (...allParams) => {
                const [decoratee, model, ids] = allParams;

                const entries = await decoratee(model, ids);

                return filterEntriesByFolder.execute(entries);
            }
        );

        decorateIfModelAuthorizationEnabled(
            context,
            "getPublishedEntriesByIds",
            async (...allParams) => {
                const [decoratee, model, ids] = allParams;

                const entries = await decoratee(model, ids);
                return filterEntriesByFolder.execute(entries);
            }
        );

        decorateIfModelAuthorizationEnabled(context, "createEntry", async (...allParams) => {
            const [decoratee, model, params, options] = allParams;
            const folderId = params.wbyAco_location?.folderId || params.location?.folderId;

            if (!folderId || folderId === ROOT_FOLDER) {
                return decoratee(model, params, options);
            }

            const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                permissions,
                rwd: "w"
            });

            return decoratee(model, params, options);
        });

        decorateIfModelAuthorizationEnabled(
            context,
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

                const permissions =
                    await folderLevelPermissions.getFolderLevelPermissions(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    permissions,
                    rwd: "w"
                });

                return decoratee(model, id, input, options);
            }
        );

        decorateIfModelAuthorizationEnabled(context, "updateEntry", async (...allParams) => {
            const [decoratee, model, id, input, meta, options] = allParams;
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return decoratee(model, id, input, meta, options);
            }

            const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                permissions,
                rwd: "w"
            });

            return decoratee(model, id, input, meta, options);
        });

        decorateIfModelAuthorizationEnabled(context, "deleteEntry", async (...allParams) => {
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

            const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                permissions,
                rwd: "d"
            });

            return decoratee(model, id, options);
        });

        decorateIfModelAuthorizationEnabled(
            context,
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

                const permissions =
                    await folderLevelPermissions.getFolderLevelPermissions(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    permissions,
                    rwd: "d"
                });

                return decoratee(model, id);
            }
        );

        decorateIfModelAuthorizationEnabled(context, "moveEntry", async (...allParams) => {
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
                const permissions =
                    await folderLevelPermissions.getFolderLevelPermissions(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    permissions,
                    rwd: "w"
                });
            }
            /**
             * If target folder is not a ROOT_FOLDER, check for access.
             */
            if (targetFolderId !== ROOT_FOLDER) {
                const permissions =
                    await folderLevelPermissions.getFolderLevelPermissions(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    permissions,
                    rwd: "w"
                });
            }

            return decoratee(model, id, targetFolderId);
        });
    }
}
