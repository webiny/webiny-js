import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import WebinyError from "@webiny/error";
import {
    CreatedBy,
    File,
    FileManagerFilesStorageOperationsListParamsWhere,
    FileManagerFilesStorageOperationsTagsParamsWhere,
    FilesCRUD,
    FilesListOpts
} from "~/types";
import { FileManagerConfig } from "~/createFileManager/index";
import { ROOT_FOLDER } from "~/contants";
import { NotAuthorizedError } from "@webiny/api-security";

const getDate = (input: Date | string | undefined | null, defaultValue: Date | string): string => {
    if (!input) {
        if (defaultValue instanceof Date) {
            return defaultValue.toISOString();
        }
        return defaultValue;
    } else if (input instanceof Date) {
        return input.toISOString();
    }
    try {
        return new Date(input).toISOString();
    } catch {
        if (defaultValue instanceof Date) {
            return defaultValue.toISOString();
        }
        return defaultValue;
    }
};

export const createFilesCrud = (config: FileManagerConfig): FilesCRUD => {
    const {
        storageOperations,
        filesPermissions,
        getLocaleCode,
        getTenantId,
        getIdentity,
        WEBINY_VERSION
    } = config;

    return {
        onFileBeforeCreate: createTopic("fileManager.onFileBeforeCreate"),
        onFileAfterCreate: createTopic("fileManager.onFileAfterCreate"),
        onFileBeforeBatchCreate: createTopic("fileManager.onFileBeforeBatchCreate"),
        onFileAfterBatchCreate: createTopic("fileManager.onFileAfterBatchCreate"),
        onFileBeforeUpdate: createTopic("fileManager.onFileBeforeUpdate"),
        onFileAfterUpdate: createTopic("fileManager.onFileAfterUpdate"),
        onFileBeforeDelete: createTopic("fileManager.onFileBeforeDelete"),
        onFileAfterDelete: createTopic("fileManager.onFileAfterDelete"),
        async getFile(id: string) {
            await filesPermissions.ensure({ rwd: "r" });

            const file = await storageOperations.files.get({
                where: {
                    id,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });

            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            await filesPermissions.ensure({ owns: file.createdBy });

            return file;
        },
        async createFile(input, meta) {
            await filesPermissions.ensure({ rwd: "w" });

            const identity = getIdentity();

            // Extract ID from file key
            const [id] = input.key.split("/");

            const date = new Date();
            const file: File = {
                ...input,
                tags: Array.isArray(input.tags) ? input.tags : [],
                aliases: Array.isArray(input.aliases) ? input.aliases : [],
                id: input.id || id,
                location: {
                    folderId: input.location?.folderId ?? ROOT_FOLDER
                },
                meta: {
                    private: false,
                    ...(input.meta || {})
                },
                tenant: getTenantId(),
                createdOn: getDate(input.createdOn, date),
                savedOn: getDate(input.savedOn, date),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                locale: getLocaleCode(),
                webinyVersion: WEBINY_VERSION
            };

            try {
                await this.onFileBeforeCreate.publish({ file, meta });

                const result = await storageOperations.files.create({ file });

                await this.onFileAfterCreate.publish({ file, meta });
                return result;
            } catch (ex) {
                // If a `NotAuthorizedError` error was thrown, then we just want to rethrow it.
                if (ex instanceof NotAuthorizedError) {
                    throw ex;
                }

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
            await filesPermissions.ensure({ rwd: "w" });

            const original = await storageOperations.files.get({
                where: {
                    id,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });

            if (!original) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            await filesPermissions.ensure({ owns: original.createdBy });

            const file: File = {
                ...original,
                ...input,
                createdOn: getDate(input.createdOn, original.createdOn),
                savedOn: getDate(input.savedOn, new Date()),
                tags: Array.isArray(input.tags)
                    ? input.tags
                    : Array.isArray(original.tags)
                    ? original.tags
                    : [],
                aliases: Array.isArray(input.aliases)
                    ? input.aliases
                    : Array.isArray(original.aliases)
                    ? original.aliases
                    : [],
                id: original.id,
                webinyVersion: WEBINY_VERSION
            };

            try {
                await this.onFileBeforeUpdate.publish({
                    original,
                    file,
                    input
                });

                const result = await storageOperations.files.update({
                    original,
                    file
                });

                await this.onFileAfterUpdate.publish({
                    original,
                    file,
                    input
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
            await filesPermissions.ensure({ rwd: "d" });

            const file = await storageOperations.files.get({
                where: {
                    id,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });

            if (!file) {
                throw new NotFoundError(`File with id "${id}" does not exists.`);
            }

            await filesPermissions.ensure({ owns: file.createdBy });

            try {
                await this.onFileBeforeDelete.publish({ file });

                await storageOperations.files.delete({
                    file
                });

                await this.onFileAfterDelete.publish({ file });
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
        async createFilesInBatch(inputs, meta) {
            await filesPermissions.ensure({ rwd: "w" });

            const identity = getIdentity();
            const tenant = getTenantId();
            const locale = getLocaleCode();

            const createdBy: CreatedBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const files: File[] = inputs.map(input => {
                return {
                    ...input,
                    tags: Array.isArray(input.tags) ? input.tags : [],
                    aliases: Array.isArray(input.aliases) ? input.aliases : [],
                    meta: {
                        private: false,
                        ...(input.meta || {})
                    },
                    location: {
                        folderId: input.location?.folderId ?? ROOT_FOLDER
                    },
                    tenant,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    createdBy,
                    locale,
                    webinyVersion: WEBINY_VERSION
                };
            });

            try {
                await this.onFileBeforeBatchCreate.publish({ files, meta });
                const results = await storageOperations.files.createBatch({
                    files
                });
                await this.onFileAfterBatchCreate.publish({ files, meta });
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
        async listFiles(params: FilesListOpts = {}) {
            await filesPermissions.ensure({ rwd: "r" });

            const {
                limit = 40,
                after = null,
                where: initialWhere,
                sort: initialSort,
                search
            } = params;

            const where: FileManagerFilesStorageOperationsListParamsWhere = {
                ...{ meta: { private_not: true }, ...initialWhere },
                locale: getLocaleCode(),
                tenant: getTenantId()
            };

            /**
             * Always override the createdBy received from the user, if any.
             */
            if (await filesPermissions.canAccessOnlyOwnRecords()) {
                const identity = getIdentity();
                where.createdBy = identity.id;
            }

            const sort =
                Array.isArray(initialSort) && initialSort.length > 0 ? initialSort : ["id_DESC"];
            try {
                return await storageOperations.files.list({
                    where,
                    after,
                    limit,
                    sort,
                    search
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list files by given parameters.",
                    ex.code || "FILE_TAG_SEARCH_ERROR",
                    {
                        ...(ex.data || {}),
                        where,
                        after,
                        limit,
                        sort
                    }
                );
            }
        },
        async listTags({ where: initialWhere, after, limit }) {
            await filesPermissions.ensure();

            const where: FileManagerFilesStorageOperationsTagsParamsWhere = {
                ...initialWhere,
                tenant: getTenantId(),
                locale: getLocaleCode()
            };

            const params = {
                where,
                limit: limit || 1000000,
                after
            };

            try {
                return await storageOperations.files.tags(params);
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
};
