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

import { FoldersConfig, Entry, ListEntriesParams, EntryInput, IEntries } from "~/types";

const CreateDataModel = withFields({
    id: string({ validation: validation.create("required") }),
    folderId: string({ validation: validation.create("required") }),
    tenant: string({ validation: validation.create("required") }),
    locale: string({ validation: validation.create("required") })
})();

const UpdateDataModel = withFields({
    folderId: string({ validation: validation.create("required") })
})();

export default async ({
    getTenantId,
    getLocaleCode,
    getIdentity,
    storageOperations
}: FoldersConfig): Promise<IEntries> => {
    const tenant = getTenantId();
    const locale = getLocaleCode();

    return {
        async getEntry(id: string): Promise<Entry> {
            let entry: Entry | null = null;
            try {
                entry = await storageOperations.getEntry({ tenant, locale, id });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not get entry.",
                    code: "GET_ENTRY_ERROR",
                    data: { id }
                });
            }
            if (!entry) {
                throw new NotFoundError(`Unable to find entry with id: ${id}`);
            }
            return entry;
        },

        async listEntries({ where }: ListEntriesParams): Promise<Entry[]> {
            try {
                return await storageOperations.listEntries({
                    where: { tenant, locale, ...where },
                    sort: ["createdOn_ASC"]
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list entries.",
                    code: "LIST_ENTRIES_ERROR",
                    data: { ...where }
                });
            }
        },

        async createEntry(input: EntryInput): Promise<Entry> {
            await new CreateDataModel().populate({ ...input, tenant, locale }).validate();

            const existing = await storageOperations.getEntry({
                tenant,
                locale,
                folderId: input.folderId,
                id: input.id
            });

            if (existing) {
                throw new WebinyError(
                    `Entry with id "${input.id}" already exists.`,
                    "ENTRY_EXISTS"
                );
            }

            const identity = getIdentity();

            const entry: Entry = {
                eId: mdbid(),
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
                return await storageOperations.createEntry({ entry });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create entry.",
                    code: "CREATE_ENTRY_ERROR",
                    data: { ...input }
                });
            }
        },

        async updateEntry(id: string, input: Record<string, any>): Promise<Entry> {
            const model = await new UpdateDataModel().populate(input);

            await model.validate();

            const original = await storageOperations.getEntry({ tenant, locale, id });

            if (!original) {
                throw new NotFoundError(`Entry "${id}" was not found!`);
            }

            const data = await model.toJSON({ onlyDirty: true });

            const entry: Entry = {
                ...original,
                ...data
            };

            try {
                const result = await storageOperations.updateEntry({ original, entry });
                return result;
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not update entry.",
                    error.code || "UPDATE_ENTRY_ERROR",
                    {
                        entry
                    }
                );
            }
        },

        async deleteEntry(id: string): Promise<void> {
            const entry = await storageOperations.getEntry({ tenant, locale, id });

            if (!entry) {
                throw new NotFoundError(`Entry "${id}" was not found!`);
            }

            try {
                await storageOperations.deleteEntry({ entry });
            } catch (error) {
                throw new WebinyError(
                    error.message || "Could not delete entry.",
                    error.code || "DELETE_ENTRY_ERROR",
                    {
                        entry
                    }
                );
            }
        }
    };
};
