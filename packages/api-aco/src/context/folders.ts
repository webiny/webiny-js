/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import joi from "joi";

import {
    Folder,
    FolderInput,
    FoldersConfig,
    GetFolderParams,
    IFolders,
    ListFoldersParams,
    OnFolderAfterCreateTopicParams,
    OnFolderAfterDeleteTopicParams,
    OnFolderAfterUpdateTopicParams,
    OnFolderBeforeCreateTopicParams,
    OnFolderBeforeDeleteTopicParams,
    OnFolderBeforeUpdateTopicParams
} from "~/types";

const requiredString = joi.string().required();

const createSchema = joi.object({
    name: requiredString.min(3),
    slug: requiredString.min(3),
    type: requiredString,
    tenant: requiredString,
    locale: requiredString
});

const updateSchema = joi.object({
    name: requiredString.min(3),
    slug: requiredString.min(3)
});

export const createFoldersContext = async ({
    getTenantId,
    getLocaleCode,
    getIdentity,
    storageOperations
}: FoldersConfig): Promise<IFolders> => {
    // create
    const onFolderBeforeCreate = createTopic<OnFolderBeforeCreateTopicParams>(
        "folders.onFolderBeforeCreate"
    );
    const onFolderAfterCreate = createTopic<OnFolderAfterCreateTopicParams>(
        "folders.onFolderAfterCreate"
    );
    // update
    const onFolderBeforeUpdate = createTopic<OnFolderBeforeUpdateTopicParams>(
        "folders.onFolderBeforeUpdate"
    );
    const onFolderAfterUpdate = createTopic<OnFolderAfterUpdateTopicParams>(
        "folders.onFolderAfterUpdate"
    );
    // delete
    const onFolderBeforeDelete = createTopic<OnFolderBeforeDeleteTopicParams>(
        "folders.onFolderBeforeDelete"
    );
    const onFolderAfterDelete = createTopic<OnFolderAfterDeleteTopicParams>(
        "folders.onFolderAfterDelete"
    );

    return {
        onFolderBeforeCreate,
        onFolderAfterCreate,
        onFolderBeforeUpdate,
        onFolderAfterUpdate,
        onFolderBeforeDelete,
        onFolderAfterDelete,
        async getFolder({ id }: GetFolderParams): Promise<Folder> {
            const tenant = getTenantId();
            const locale = getLocaleCode();

            let folder: Folder | undefined;

            try {
                folder = await storageOperations.getFolder({ tenant, locale, id });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not get folder.",
                    code: "GET_FOLDER_ERROR",
                    data: { id }
                });
            }
            if (!folder) {
                throw new NotFoundError(`Unable to find folder with id: ${id}`);
            }
            return folder;
        },

        async listFolders({ where }: ListFoldersParams): Promise<Folder[]> {
            const tenant = getTenantId();
            const locale = getLocaleCode();

            try {
                return await storageOperations.listFolders({
                    where: { tenant, locale, ...where },
                    sort: ["createdOn_ASC"]
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list folders.",
                    code: "LIST_FOLDERS_ERROR",
                    data: { ...where }
                });
            }
        },

        async createFolder(input: FolderInput): Promise<Folder> {
            await createSchema.validate(input);

            const tenant = getTenantId();
            const locale = getLocaleCode();
            const { type, slug, parentId } = input;

            const existing = await storageOperations.getFolder({
                tenant,
                locale,
                type,
                slug,
                parentId
            });

            if (existing) {
                throw new WebinyError(
                    `Folder with slug "${slug}" already exists at this level.`,
                    "FOLDER_EXISTS"
                );
            }

            const identity = getIdentity();

            const folder: Folder = {
                id: mdbid(),
                tenant,
                locale,
                ...input,
                webinyVersion: process.env.WEBINY_VERSION as string,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                }
            };

            try {
                await onFolderBeforeCreate.publish({
                    folder
                });
                const result = await storageOperations.createFolder({ folder });
                await onFolderAfterCreate.publish({
                    folder: result
                });
                return result;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create folder.",
                    code: "CREATE_FOLDER_ERROR",
                    data: { ...input }
                });
            }
        },

        async updateFolder(id: string, input: Record<string, any>): Promise<Folder> {
            await updateSchema.validate(input);

            const tenant = getTenantId();
            const locale = getLocaleCode();
            const { slug, parentId } = input;

            const original = await storageOperations.getFolder({ tenant, locale, id });

            if (!original) {
                throw new NotFoundError(`Folder "${id}" was not found!`);
            }

            const existing = await storageOperations.getFolder({
                tenant,
                locale,
                type: original.type,
                slug: slug || original.slug,
                parentId: parentId !== undefined ? parentId : original.parentId // parentId can be `null`
            });

            // Check if another folder exists already inside the target
            if (existing && existing?.id !== id) {
                throw new WebinyError(
                    `Folder with slug "${slug}" already exists at this level.`,
                    "FOLDER_EXISTS"
                );
            }

            const folder: Folder = {
                ...original,
                ...input
            };
            try {
                await onFolderBeforeUpdate.publish({
                    folder,
                    original
                });
                const result = await storageOperations.updateFolder({ original, folder });
                await onFolderAfterUpdate.publish({
                    folder: result,
                    original
                });
                return result;
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not update folder.",
                    error.code || "UPDATE_FOLDER_ERROR",
                    {
                        folder
                    }
                );
            }
        },

        async deleteFolder(id: string): Promise<void> {
            const tenant = getTenantId();
            const locale = getLocaleCode();

            const folder = await storageOperations.getFolder({ tenant, locale, id });

            if (!folder) {
                throw new NotFoundError(`Folder "${id}" was not found!`);
            }

            try {
                await onFolderBeforeDelete.publish({
                    folder
                });
                const result = storageOperations.deleteFolder({ folder });
                await onFolderAfterDelete.publish({
                    folder
                });
                return result;
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not delete folder.",
                    error.code || "DELETE_FOLDER_ERROR",
                    {
                        folder
                    }
                );
            }
        }
    };
};
