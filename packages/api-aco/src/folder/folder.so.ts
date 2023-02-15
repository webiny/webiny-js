import { CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

import { FOLDER_MODEL_ID } from "./folder.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { getFieldValues } from "~/utils/getFieldValues";

import { AcoFolderStorageOperations as BaseAcoFolderStorageOperations } from "./folder.types";

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
        const model = await getFolderModel();
        security.disableAuthorization();

        let entry;

        if (id) {
            entry = await cms.getEntryById(model, id);
        } else if (slug && type) {
            entry = await cms.getEntry(model, { where: { slug, type, parentId, latest: true } });
        }

        if (!entry) {
            throw new WebinyError("Could not load folder.", "GET_FOLDER_ERROR", {
                id,
                slug,
                type,
                parentId
            });
        }

        security.enableAuthorization();
        return getFieldValues(entry, baseFields);
    };

    const checkExistingFolder = async ({ id, params }: AcoCheckExistingFolderParams) => {
        const model = await getFolderModel();
        security.disableAuthorization();

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

        security.enableAuthorization();
        return;
    };

    return {
        getFolderModel,
        getFolder,
        async listFolders(params) {
            const model = await getFolderModel();
            security.disableAuthorization();

            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params,
                where: {
                    ...(params.where || {})
                }
            });

            security.enableAuthorization();
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createFolder({ data }) {
            const model = await getFolderModel();
            security.disableAuthorization();

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

            security.enableAuthorization();
            return getFieldValues(entry, baseFields);
        },
        async updateFolder({ id, data }) {
            const { slug, parentId } = data;
            const model = await getFolderModel();
            security.disableAuthorization();

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
            security.enableAuthorization();
            return getFieldValues(entry, baseFields);
        },
        async deleteFolder({ id }) {
            const model = await getFolderModel();
            security.disableAuthorization();

            await cms.deleteEntry(model, id);

            security.enableAuthorization();
            return true;
        }
    };
};
