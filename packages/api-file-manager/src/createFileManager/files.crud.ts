import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import { createTopic } from "@webiny/pubsub";
import WebinyError from "@webiny/error";
import { SecurityIdentity } from "@webiny/api-security/types";
import {
    CreatedBy,
    File,
    FileManagerFilesStorageOperationsListParamsWhere,
    FileManagerFilesStorageOperationsTagsParamsWhere,
    FilePermission,
    FilesCRUD,
    FilesListOpts
} from "~/types";
import { checkBasePermissions } from "./checkBasePermissions";
import { FileManagerConfig } from "~/createFileManager/index";

/**
 * If permission is limited to "own" files only, check that current identity owns the file.
 */
const checkOwnership = (file: File, permission: FilePermission, identity: SecurityIdentity) => {
    if (permission?.own === true) {
        if (file.createdBy.id !== identity.id) {
            throw new NotAuthorizedError();
        }
    }
};

const ensureMimeTag = (file: File) => {
    const hasMimeTag = file.tags.some(tag => tag.startsWith("mime:"));
    if (!hasMimeTag) {
        file.tags.push(`mime:${file.type}`);
    }
    return file.tags;
};

export const createFilesCrud = (config: FileManagerConfig): FilesCRUD => {
    const {
        storageOperations,
        getLocaleCode,
        getTenantId,
        getIdentity,
        getPermission,
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
            const permission = await checkBasePermissions(getPermission, { rwd: "r" });

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

            checkOwnership(file, permission, getIdentity());

            return file;
        },
        async createFile(input, meta) {
            await checkBasePermissions(getPermission, { rwd: "w" });
            const identity = getIdentity();

            // Extract ID from file key
            const [id] = input.key.split("/");

            const file: File = {
                ...input,
                tags: Array.isArray(input.tags) ? input.tags : [],
                aliases: Array.isArray(input.aliases) ? input.aliases : [],
                id: input.id || id,
                location: {
                    folderId: input.location?.folderId ?? "ROOT"
                },
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

            file.tags = ensureMimeTag(file);

            try {
                await this.onFileBeforeCreate.publish({ file, meta });

                const result = await storageOperations.files.create({ file });

                await this.onFileAfterCreate.publish({ file, meta });
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
            const permission = await checkBasePermissions(getPermission, { rwd: "w" });

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

            checkOwnership(original, permission, getIdentity());

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
            const permission = await checkBasePermissions(getPermission, { rwd: "d" });

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

            checkOwnership(file, permission, getIdentity());

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
            await checkBasePermissions(getPermission, { rwd: "w" });

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
                        folderId: input.location?.folderId ?? "ROOT"
                    },
                    tenant,
                    createdOn: new Date().toISOString(),
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
            const permission = await checkBasePermissions(getPermission, { rwd: "r" });

            const {
                limit = 40,
                after = null,
                where: initialWhere,
                sort: initialSort,
                search = null
            } = params;

            const where: FileManagerFilesStorageOperationsListParamsWhere = {
                ...{ meta: { private_not: true }, ...initialWhere },
                locale: getLocaleCode(),
                tenant: getTenantId()
            };

            if (search) {
                where.OR = [{ name_contains: search }, { tags_contains: search }];
            }

            /**
             * Always override the createdBy received from the user, if any.
             */
            if (permission.own === true) {
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
            await checkBasePermissions(getPermission);

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
