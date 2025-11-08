import type { AcoFolderCrud } from "./folder.types.js";
import { type ListFoldersParams } from "./folder.types.js";

import type { Folder } from "~/types.js";
import { UpdateFolderUseCase } from "~/features/folders/UpdateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folders/DeleteFolder/index.js";
import { CreateFolderUseCase } from "~/features/folders/CreateFolder/index.js";
import { GetFolderUseCase } from "~/features/folders/GetFolder/index.js";
import { ListFoldersUseCase } from "~/features/folders/ListFolders/index.js";
import { GetFolderHierarchyUseCase } from "~/features/folders/GetFolderHierarchy/index.js";
import { GetAncestorsUseCase } from "~/features/folders/GetAncestors/index.js";
import { ListFolderLevelPermissionsTargetsUseCase } from "~/features/folders/ListFolderLevelPermissionsTargets/index.js";
import type { Container } from "@webiny/di";

const FIXED_FOLDER_LISTING_LIMIT = 10_000;

interface CreateFolderCrudMethodsParams {
    container: Container;
}

export const createFolderCrudMethods = ({
    container
}: CreateFolderCrudMethodsParams): AcoFolderCrud => {
    return {
        async get(id: string) {
            const getFolderUseCase = container.resolve(GetFolderUseCase);
            return await getFolderUseCase.execute({ id });
        },

        async list(params: ListFoldersParams) {
            const listFoldersUseCase = container.resolve(ListFoldersUseCase);
            return await listFoldersUseCase.execute(params);
        },

        async listAll(params) {
            return await this.list({
                ...params,
                limit: FIXED_FOLDER_LISTING_LIMIT
            });
        },

        async getFolderHierarchy(params) {
            const getFolderHierarchyUseCase = container.resolve(GetFolderHierarchyUseCase);
            return await getFolderHierarchyUseCase.execute(params);
        },

        async create(data) {
            const createFolderUseCase = container.resolve(CreateFolderUseCase);
            return await createFolderUseCase.execute(data);
        },

        async delete(id) {
            const deleteFolderUseCase = container.resolve(DeleteFolderUseCase);
            return await deleteFolderUseCase.execute({ id });
        },

        async update(id, data) {
            const updateFolderUseCase = container.resolve(UpdateFolderUseCase);
            return await updateFolderUseCase.execute(id, data);
        },

        async getAncestors(folder: Folder) {
            const getAncestorsUseCase = container.resolve(GetAncestorsUseCase);
            return getAncestorsUseCase.execute({ folder });
        },

        async listFolderLevelPermissionsTargets() {
            const listFolderLevelPermissionsTargetsUseCase = container.resolve(
                ListFolderLevelPermissionsTargetsUseCase
            );
            return await listFolderLevelPermissionsTargetsUseCase.execute();
        }
    };
};
