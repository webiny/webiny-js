import WebinyError from "@webiny/error";

import { FOLDER_MODEL_ID } from "./folder.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { getFieldValues } from "~/utils/getFieldValues";

import { AcoFolderStorageOperations } from "./folder.types";

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

            return getFieldValues(entry, baseFields);
        });
    };

    const checkExistingFolder = ({ id, params }: AcoCheckExistingFolderParams) => {
        return withModel(async model => {
            const { type, slug, parentId } = params;

            const [existings] = await cms.listLatestEntries(model, {
                where: {
                    type,
                    slug,
                    parentId,
                    id_not: id
                },
                limit: 1
            });

            if (existings.length > 0) {
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
                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    where: {
                        ...(params.where || {})
                    }
                });

                return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
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

                return getFieldValues(entry, baseFields);
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
                    ...original,
                    ...data
                };

                const entry = await cms.updateEntry(model, id, input);
                return getFieldValues(entry, baseFields);
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
