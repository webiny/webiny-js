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

import { FolderInput, Folder, Folders, FoldersConfig, GetFolderParams } from "~/types";

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") }),
    category: string({ validation: validation.create("required,in:page:cms:file") }),
    tenant: string({ validation: validation.create("required") }),
    locale: string({ validation: validation.create("required") })
})();

export const createFolders = async ({
    getTenantId,
    getLocaleCode,
    storageOperations
}: FoldersConfig): Promise<Folders> => {
    const tenant = getTenantId();
    const locale = getLocaleCode();

    return {
        async getFolder({ where }: GetFolderParams): Promise<Folder> {
            let folder: Folder | null = null;
            try {
                folder = await storageOperations.getFolder({
                    where: { tenant, locale, ...where }
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not get folder.",
                    code: "GET_FOLDER_ERROR",
                    data: { ...where }
                });
            }
            if (!folder) {
                throw new NotFoundError(`Unable to find group : ${JSON.stringify(where)}`);
            }
            return folder;
        },

        async createFolder(input: FolderInput): Promise<Folder> {
            await new CreateDataModel().populate({ ...input, tenant, locale }).validate();

            const existing = await storageOperations.getFolder({
                where: {
                    tenant,
                    locale,
                    category: input.category,
                    slug: input.slug
                }
            });

            if (existing) {
                throw new WebinyError(
                    `Folder with slug "${input.slug}" already exists.`,
                    "FOLDER_EXISTS"
                );
            }

            const folder: Folder = {
                id: mdbid(),
                tenant,
                locale,
                ...input,
                webinyVersion: process.env.WEBINY_VERSION as string,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: "ID", // TODO: how does security work?
                    displayName: "DISPLAY_NAME",
                    type: "TYPE"
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
        }
    };
};
