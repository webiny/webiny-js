/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import joi from "joi";

import {
    Folder,
    FolderInput,
    FoldersConfig,
    GetFolderParams,
    IFolders,
    ListFoldersParams
} from "~/types";

const requiredString = joi.string().required();

const createSchema = joi.object({
    name: requiredString.min(3),
    slug: requiredString.min(3),
    type: requiredString.pattern(/page|cms|file/),
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
    const checkFolderExists = async ({
        tenant,
        locale,
        type,
        slug,
        parentId
    }: Pick<Folder, "tenant" | "locale" | "type" | "slug" | "parentId">): Promise<void> => {
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

        return;
    };

    return {
        async getFolder({ id }: GetFolderParams): Promise<Folder> {
            const tenant = getTenantId();
            const locale = getLocaleCode();

            let folder: Folder | null = null;

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

            await checkFolderExists({ tenant, locale, type, slug, parentId });

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
                return await storageOperations.createFolder({ folder });
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

            await checkFolderExists({
                tenant,
                locale,
                type: original.type,
                slug: slug || original.slug,
                parentId: parentId !== undefined ? parentId : original.parentId // parentId can be `null`
            });

            const folder: Folder = {
                ...original,
                ...input
            };
            try {
                return await storageOperations.updateFolder({ original, folder });
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
                await storageOperations.deleteFolder({ folder });
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
