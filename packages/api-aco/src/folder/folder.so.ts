import { CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

import { FOLDER_MODEL_ID } from "./folder.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { getFieldValues } from "~/utils/getFieldValues";

import {
    AcoFolderStorageOperations as BaseAcoFolderStorageOperations,
    Folder
} from "./folder.types";
import { ListMeta } from "~/types";

interface AcoFolderStorageOperations extends BaseAcoFolderStorageOperations {
    getFolderModel(): Promise<CmsModel>;
}

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
    const { cms, security } = params;
    const getFolderModel = async () => {
        security.disableAuthorization();
        const model = await cms.getModel(FOLDER_MODEL_ID);
        security.enableAuthorization();
        if (!model) {
            throw new WebinyError(
                `Could not find "${FOLDER_MODEL_ID}" model.`,
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };

    const getFolder: AcoFolderStorageOperations["getFolder"] = async ({
        id,
        slug,
        type,
        parentId
    }) => {
        return await security.withoutAuthorization<Folder>(async () => {
            const model = await getFolderModel();
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

    const checkExistingFolder = async ({ id, params }: AcoCheckExistingFolderParams) => {
        await security.withoutAuthorization(async () => {
            const model = await getFolderModel();

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
        getFolderModel,
        getFolder,
        async listFolders(params) {
            return await security.withoutAuthorization<[Folder[], ListMeta]>(async () => {
                const model = await getFolderModel();

                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    where: {
                        ...(params.where || {})
                    }
                });

                return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
            });
        },
        async createFolder({ data }) {
            return await security.withoutAuthorization<Folder>(async () => {
                const model = await getFolderModel();

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
        async updateFolder({ id, data }) {
            return await security.withoutAuthorization<Folder>(async () => {
                const { slug, parentId } = data;
                const model = await getFolderModel();

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
        async deleteFolder({ id }) {
            return await security.withoutAuthorization<boolean>(async () => {
                const model = await getFolderModel();
                await cms.deleteEntry(model, id);
                return true;
            });
        }
    };
};
