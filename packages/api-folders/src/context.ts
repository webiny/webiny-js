/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { string, withFields } from "@commodo/fields";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { validation } from "@webiny/validation";

import {
    FolderInput,
    Folder,
    Folders,
    FoldersConfig,
    GetFolderParams,
    ListFoldersParams
} from "~/types";

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") }),
    category: string({ validation: validation.create("required,in:page:cms:file") }),
    tenant: string({ validation: validation.create("required") }),
    locale: string({ validation: validation.create("required") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") })
})();

export const createFolders = async ({
    getTenantId,
    getLocaleCode,
    getIdentity,
    storageOperations
}: FoldersConfig): Promise<Folders> => {
    const tenant = getTenantId();
    const locale = getLocaleCode();

    return {
        async getFolder({ id }: GetFolderParams): Promise<Folder> {
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
            await new CreateDataModel().populate({ ...input, tenant, locale }).validate();

            const existing = await storageOperations.getFolder({
                tenant,
                locale,
                category: input.category,
                slug: input.slug
            });

            if (existing) {
                throw new WebinyError(
                    `Folder with slug "${input.slug}" already exists.`,
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
            const model = await new UpdateDataModel().populate(input);

            await model.validate();

            const original = await storageOperations.getFolder({ tenant, locale, id });

            if (!original) {
                throw new NotFoundError(`Folder "${id}" was not found!`);
            }

            const data = await model.toJSON({ onlyDirty: true });

            const folder: Folder = {
                ...original,
                ...data
            };
            try {
                const result = await storageOperations.updateFolder({ original, folder });
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
