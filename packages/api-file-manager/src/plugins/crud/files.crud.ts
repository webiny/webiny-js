import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import {
    File,
    FileManagerContext,
    FileManagerFilesStorageOperationsListParamsWhere,
    FileManagerFilesStorageOperationsTagsParamsWhere,
    FilePermission
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { FilePlugin } from "~/plugins/definitions/FilePlugin";
import { FilesStorageOperationsProviderPlugin } from "~/plugins/definitions/FilesStorageOperationsProviderPlugin";
import WebinyError from "@webiny/error";
import { runLifecycleEvent } from "~/plugins/crud/utils/lifecycleEvents";

const BATCH_CREATE_MAX_FILES = 20;

/**
 * If permission is limited to "own" files only, check that current identity owns the file.
 */
const checkOwnership = (file: File, permission: FilePermission, context: FileManagerContext) => {
    if (permission?.own === true) {
        const identity = context.security.getIdentity();
        if (file.createdBy.id !== identity.id) {
            throw new NotAuthorizedError();
        }
    }
};

const getLocaleCode = (context: FileManagerContext): string => {
    if (!context.i18nContent) {
        throw new WebinyError(
            "Missing i18nContent on the FileManagerContext.",
            "MISSING_I18N_CONTENT"
        );
    } else if (!context.i18nContent.locale) {
        throw new WebinyError(
            "Missing i18nContent.locale on the FileManagerContext.",
            "MISSING_I18N_CONTENT_LOCALE"
        );
    } else if (!context.i18nContent.locale.code) {
        throw new WebinyError(
            "Missing i18nContent.locale.code on the FileManagerContext.",
            "MISSING_I18N_CONTENT_LOCALE_CODE"
        );
    }
    return context.i18nContent.locale.code;
};

const filesContextCrudPlugin = new ContextPlugin<FileManagerContext>(async context => {
    const pluginType = FilesStorageOperationsProviderPlugin.type;

    const providerPlugin = context.plugins
        .byType<FilesStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    const storageOperations = await providerPlugin.provide({
        context
    });

    if (!context.fileManager) {
        context.fileManager = {} as any;
    }

    const filePlugins = context.plugins.byType<FilePlugin>(FilePlugin.type);

    context.fileManager.files = {
        async getFile(id: string) {
            const permission = await checkBasePermissions(context, { rwd: "r" });

            const file = await storageOperations.get(id);

            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(file, permission, context);

            return file;
        },
        async createFile(input) {
            await checkBasePermissions(context, { rwd: "w" });
            const identity = context.security.getIdentity();
            const tenant = context.tenancy.getCurrentTenant();

            const id = mdbid();

            const file: File = {
                ...input,
                id,
                meta: {
                    private: false,
                    ...(input.meta || {})
                },
                tenant: tenant.id,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                locale: getLocaleCode(context),
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await runLifecycleEvent("beforeCreate", {
                    context,
                    plugins: filePlugins,
                    data: file
                });
                const result = await storageOperations.create({
                    file
                });
                await runLifecycleEvent("afterCreate", {
                    context,
                    plugins: filePlugins,
                    data: file,
                    file: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create a file.",
                    ex.code || "CREATE_FILE_ERROR",
                    {
                        ...(ex.data || {}),
                        file
                    }
                );
            }
        },
        async updateFile(id, input) {
            const permission = await checkBasePermissions(context, { rwd: "w" });

            const original = await storageOperations.get(id);

            if (!original) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(original, permission, context);

            const file = {
                ...original,
                ...input,
                id: original.id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await runLifecycleEvent("beforeUpdate", {
                    context,
                    plugins: filePlugins,
                    original,
                    data: file
                });
                const result = await storageOperations.update({
                    original,
                    file
                });
                await runLifecycleEvent("afterUpdate", {
                    context,
                    plugins: filePlugins,
                    original,
                    data: file,
                    file: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update a file.",
                    ex.code || "UPDATE_FILE_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        file
                    }
                );
            }
        },
        async deleteFile(id) {
            const permission = await checkBasePermissions(context, { rwd: "d" });

            const file = await storageOperations.get(id);
            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            checkOwnership(file, permission, context);

            try {
                await runLifecycleEvent("beforeDelete", {
                    context,
                    plugins: filePlugins,
                    file
                });
                await storageOperations.delete(id);
                await runLifecycleEvent("afterDelete", {
                    context,
                    plugins: filePlugins,
                    file
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete a file.",
                    ex.code || "DELETE_FILE_ERROR",
                    {
                        ...(ex.data || {}),
                        id,
                        file
                    }
                );
            }

            return true;
        },
        async createFilesInBatch(inputs) {
            if (!Array.isArray(inputs)) {
                throw new Error(`"data" must be an array.`, "CREATE_FILES_NON_ARRAY");
            }

            if (inputs.length === 0) {
                throw new Error(
                    `"data" argument must contain at least one file.`,
                    "CREATE_FILES_MIN_FILES"
                );
            }

            if (inputs.length > BATCH_CREATE_MAX_FILES) {
                throw new Error(
                    `"data" argument must not contain more than ${BATCH_CREATE_MAX_FILES} files.`,
                    "CREATE_FILES_MAX_FILES"
                );
            }

            await checkBasePermissions(context, { rwd: "w" });

            const identity = context.security.getIdentity();
            const tenant = context.tenancy.getCurrentTenant();
            const createdBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const files: File[] = inputs.map(input => {
                return {
                    ...input,
                    meta: {
                        private: false,
                        ...(input.meta || {})
                    },
                    id: mdbid(),
                    tenant: tenant.id,
                    createdOn: new Date().toISOString(),
                    createdBy,
                    locale: getLocaleCode(context),
                    webinyVersion: context.WEBINY_VERSION
                };
            });

            try {
                await runLifecycleEvent("beforeBatchCreate", {
                    context,
                    plugins: filePlugins,
                    data: files
                });
                const results = await storageOperations.createBatch({
                    files
                });
                await runLifecycleEvent("afterBatchCreate", {
                    context,
                    plugins: filePlugins,
                    data: files,
                    files: results
                });
                return results;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create a batch of files.",
                    ex.code || "CREATE_FILES_ERROR",
                    {
                        ...(ex.data || {}),
                        files
                    }
                );
            }
        },
        async listFiles(params = {}) {
            const permission = await checkBasePermissions(context, { rwd: "r" });

            const {
                limit = 40,
                search = "",
                types = [],
                tags = [],
                ids = [],
                after = null
            } = params;

            const { i18nContent } = context;

            const where: FileManagerFilesStorageOperationsListParamsWhere = {
                private: false,
                locale: i18nContent.locale.code
            };
            /**
             * Always override the createdBy received from the user, if any.
             */
            if (permission.own === true) {
                const identity = context.security.getIdentity();
                where.createdBy = identity.id;
            }
            /**
             * To have standardized where objects across the applications, we transform the types into type_in.
             */
            if (Array.isArray(types) && types.length > 0) {
                where.type_in = types;
            }
            /**
             * TODO: determine the change of this part.
             * Either assign search keyword to something meaningful or throw it out.
             */
            if (search) {
                where.search = search;
            }
            /**
             * Same as on types/type_in.
             */
            if (Array.isArray(tags) && tags.length > 0) {
                where.tag_in = tags.map(tag => tag.toLowerCase());
            }
            /**
             * Same as on types/type_in.
             */
            if (Array.isArray(ids) && ids.length > 0) {
                where.id_in = ids;
            }

            return storageOperations.list({
                where,
                after,
                limit,
                sort: ["id_DESC"]
            });
        },
        async listTags({ after, limit }) {
            await checkBasePermissions(context);
            const { i18nContent } = context;

            const where: FileManagerFilesStorageOperationsTagsParamsWhere = {
                locale: i18nContent.locale.code
            };

            const params = {
                where,
                limit: limit || 100000,
                after
            };

            try {
                /**
                 * There is a meta object on the second key.
                 * TODO: use when changing GraphQL output of the tags.
                 */
                const [tags] = await storageOperations.tags(params);
                /**
                 * just to keep it standardized, sort by the tag ASC
                 */
                return tags.sort();
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not search for tags.",
                    ex.code || "FILE_TAG_SEARCH_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }
        }
    };
});

filesContextCrudPlugin.name = "FileManagerFilesCrud";

export default filesContextCrudPlugin;
