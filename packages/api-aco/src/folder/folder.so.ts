import omit from "lodash/omit";
import WebinyError from "@webiny/error";
import { FOLDER_MODEL_ID } from "./folder.model";
import { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createListSort } from "~/utils/createListSort";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import { AcoFolderStorageOperations, Folder } from "./folder.types";
import { ENTRY_META_FIELDS } from "@webiny/api-headless-cms/constants";

interface AcoCheckExistingFolderParams {
    params: {
        type: string;
        slug: string;
        parentId?: string | null;
    };
    id?: string;
}

export const createFolderOperations = (
    params: CreateAcoStorageOperationsParams
): AcoFolderStorageOperations => {
    const { cms } = params;

    const { withModel } = createOperationsWrapper({
        ...params,
        modelName: FOLDER_MODEL_ID
    });

    const getFolder: AcoFolderStorageOperations["getFolder"] = ({ id, slug, type, parentId }) => {
        return withModel(async model => {
            let entry;

            if (id) {
                entry = await cms.getEntryById(model, id);
            } else if (slug && type) {
                entry = await cms.getEntry(model, {
                    where: { slug, type, parentId, latest: true }
                });
            }

            if (!entry) {
                throw new WebinyError("Could not load folder.", "GET_FOLDER_ERROR", {
                    id,
                    slug,
                    type,
                    parentId
                });
            }

            return pickEntryFieldValues(entry);
        });
    };

    const checkExistingFolder = ({ id, params }: AcoCheckExistingFolderParams) => {
        return withModel(async model => {
            const { type, slug, parentId } = params;

            // We don't need to perform any kind of authorization or checks here. We just need to check
            // if the folder already exists in the database. Hence the direct storage operations access.
            const listResult = await cms.storageOperations.entries.list(model, {
                ...params,
                where: {
                    // Folders always work with latest entries. We never publish them.
                    latest: true,
                    type,
                    slug,
                    parentId,
                    id_not: id
                },
                limit: 1
            });

            if (listResult?.items?.length > 0) {
                throw new WebinyError(
                    `Folder with slug "${slug}" already exists at this level.`,
                    "FOLDER_ALREADY_EXISTS",
                    {
                        id,
                        params
                    }
                );
            }

            return;
        });
    };

    return {
        getFolder,
        listFolders(params) {
            return withModel(async model => {
                const { sort, where } = params;

                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    sort: createListSort(sort),
                    where: {
                        ...(where || {})
                    }
                });

                return [entries.map(pickEntryFieldValues<Folder>), meta];
            });
        },
        createFolder({ data }) {
            return withModel(async model => {
                await checkExistingFolder({
                    params: {
                        type: data.type,
                        slug: data.slug,
                        parentId: data.parentId
                    }
                });

                const entry = await cms.createEntry(model, {
                    ...data,
                    parentId: data.parentId || null
                });

                return pickEntryFieldValues(entry);
            });
        },
        updateFolder({ id, data }) {
            return withModel(async model => {
                const { slug, parentId } = data;

                const original = await getFolder({ id });

                await checkExistingFolder({
                    id,
                    params: {
                        type: original.type,
                        slug: slug || original.slug,
                        parentId: parentId !== undefined ? parentId : original.parentId // parentId can be `null`
                    }
                });

                const input = {
                    /**
                     *  We are omitting the standard entry meta fields:
                     *  we don't want to override them with the ones coming from the `original` entry.
                     */
                    ...omit(original, ENTRY_META_FIELDS),
                    ...data
                };

                const entry = await cms.updateEntry(model, id, input);
                return pickEntryFieldValues(entry);
            });
        },
        deleteFolder({ id }) {
            return withModel(async model => {
                await cms.deleteEntry(model, id);
                return true;
            });
        }
    };
};
