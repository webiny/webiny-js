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
import {
    canAccessAllRecords,
    canAccessOnlyOwnRecords,
    checkBasePermissions,
    checkOwnPermissions,
    hasFullAccess
} from "./utils";
import { FileManagerConfig } from "~/createFileManager/index";

export const createFilesCrud = (config: FileManagerConfig): FilesCRUD => {
    const {
        storageOperations,
        getLocaleCode,
        getTenantId,
        getIdentity,
        getPermissions,
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
            const permissions = await checkBasePermissions(getPermissions, { rwd: "r" });

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

            checkOwnPermissions(getIdentity(), permissions, file);

            return file;
        },
        async createFile(input) {
            await checkBasePermissions(getPermissions, { rwd: "w" });

            const identity = getIdentity();

            // Extract ID from file key
            const [id] = input.key.split("/");

            const file: File = {
                ...input,
                tags: Array.isArray(input.tags) ? input.tags : [],
                aliases: Array.isArray(input.aliases) ? input.aliases : [],
                id: input.id || id,
                meta: {
                    private: false,
                    ...(input.meta || {})
                },
                tenant: getTenantId(),
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                locale: getLocaleCode(),
                webinyVersion: WEBINY_VERSION
            };

            try {
                await this.onFileBeforeCreate.publish({ file });

                const result = await storageOperations.files.create({ file });

                await this.onFileAfterCreate.publish({ file });
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
            const permissions = await checkBasePermissions(getPermissions, { rwd: "w" });

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

            checkOwnPermissions(getIdentity(), permissions, original);

            const file: File = {
                ...original,
                ...input,
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
            const permissions = await checkBasePermissions(getPermissions, { rwd: "d" });

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

            checkOwnPermissions(getIdentity(), permissions, file);

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
        async createFilesInBatch(inputs) {
            await checkBasePermissions(getPermissions, { rwd: "w" });

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
                    tenant,
                    createdOn: new Date().toISOString(),
                    createdBy,
                    locale,
                    webinyVersion: WEBINY_VERSION
                };
            });

            try {
                await this.onFileBeforeBatchCreate.publish({ files });
                const results = await storageOperations.files.createBatch({
                    files
                });
                await this.onFileAfterBatchCreate.publish({ files });
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
            const permissions = await checkBasePermissions(getPermissions, { rwd: "r" });

            const {
                limit = 40,
                search = "",
                types = [],
                tags = [],
                ids = [],
                after = null,
                where: initialWhere,
                sort: initialSort
            } = params;

            const where: FileManagerFilesStorageOperationsListParamsWhere = {
                ...initialWhere,
                private: false,
                locale: getLocaleCode(),
                tenant: getTenantId()
            };

            /**
             * Always override the createdBy received from the user, if any.
             */
            if (canAccessOnlyOwnRecords(permissions)) {
                const identity = getIdentity();
                where.createdBy = identity.id;
            }

            /**
             * We need to map the old GraphQL definition to the new one.
             * That GQL definition is marked as deprecated.
             */
            /**
             * To have standardized where objects across the applications, we transform the types into type_in.
             */
            if (Array.isArray(types) && types.length > 0 && !where.type_in) {
                where.type_in = types;
            }
            /**
             * We are assigning search to tag and name search.
             * This should be treated as OR condition in the storage operations.
             */
            if (search && !where.search) {
                where.search = search;
            }
            /**
             * Same as on types/type_in.
             */
            if (Array.isArray(tags) && tags.length > 0 && !where.tag_in) {
                where.tag_in = tags.map(tag => tag.toLowerCase());
            }
            /**
             * Same as on types/type_in.
             */
            if (Array.isArray(ids) && ids.length > 0 && !where.id_in) {
                where.id_in = ids;
            }

            const sort =
                Array.isArray(initialSort) && initialSort.length > 0 ? initialSort : ["id_DESC"];
            try {
                return await storageOperations.files.list({
                    where,
                    after,
                    limit,
                    sort
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
            await checkBasePermissions(getPermissions);

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
