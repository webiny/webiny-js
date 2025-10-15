import { createTopic } from "@webiny/pubsub";
import type {
    AcoFolderCrud,
    OnFolderAfterCreateTopicParams,
    OnFolderAfterDeleteTopicParams,
    OnFolderAfterUpdateTopicParams,
    OnFolderBeforeCreateTopicParams,
    OnFolderBeforeDeleteTopicParams,
    OnFolderBeforeUpdateTopicParams
} from "./folder.types.js";
import { type ListFoldersParams } from "./folder.types.js";
import {
    getCreateFolderUseCases,
    getGetAncestors,
    getGetFolderUseCase,
    getListFolderLevelPermissionsTargets,
    getListFoldersUseCases,
    getGetFolderHierarchyUseCases
} from "~/folder/useCases/index.js";
import type { CreateAcoParams, Folder } from "~/types.js";
import { type AcoContext } from "~/types.js";
import { UpdateFolderUseCase } from "~/features/folders/UpdateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folders/DeleteFolder/index.js";

const FIXED_FOLDER_LISTING_LIMIT = 10_000;

interface CreateFolderCrudMethodsParams extends CreateAcoParams {
    context: AcoContext;
}

export const createFolderCrudMethods = ({
    container,
    storageOperations,
    folderLevelPermissions,
    context
}: CreateFolderCrudMethodsParams): AcoFolderCrud => {
    // create
    const onFolderBeforeCreate = createTopic<OnFolderBeforeCreateTopicParams>(
        "aco.onFolderBeforeCreate"
    );
    const onFolderAfterCreate =
        createTopic<OnFolderAfterCreateTopicParams>("aco.onFolderAfterCreate");
    // update
    const onFolderBeforeUpdate = createTopic<OnFolderBeforeUpdateTopicParams>(
        "aco.onFolderBeforeUpdate"
    );
    const onFolderAfterUpdate =
        createTopic<OnFolderAfterUpdateTopicParams>("aco.onFolderAfterUpdate");
    // delete
    const onFolderBeforeDelete = createTopic<OnFolderBeforeDeleteTopicParams>(
        "aco.onFolderBeforeDelete"
    );
    const onFolderAfterDelete =
        createTopic<OnFolderAfterDeleteTopicParams>("aco.onFolderAfterDelete");

    const { getFolderUseCase, getFolderUseCaseWithoutPermissions } = getGetFolderUseCase({
        getOperation: storageOperations.folder.getFolder,
        folderLevelPermissions
    });

    const { listFoldersUseCase, listFoldersUseCaseWithoutPermissions } = getListFoldersUseCases({
        listOperation: storageOperations.folder.listFolders,
        folderLevelPermissions
    });

    const { getFolderHierarchyUseCase } = getGetFolderHierarchyUseCases({
        listOperation: storageOperations.folder.listFolders,
        getOperation: storageOperations.folder.getFolder,
        folderLevelPermissions
    });

    const { createFolderUseCase } = getCreateFolderUseCases({
        createOperation: storageOperations.folder.createFolder,
        folderLevelPermissions,
        topics: {
            onFolderAfterCreate,
            onFolderBeforeCreate
        }
    });

    const { getAncestorsUseCase } = getGetAncestors({
        listFoldersUseCase: listFoldersUseCase
    });

    const { listFolderLevelPermissionsTargetsUseCase } = getListFolderLevelPermissionsTargets({
        context
    });

    return {
        /**
         * Lifecycle events
         */
        onFolderBeforeCreate,
        onFolderAfterCreate,
        onFolderBeforeUpdate,
        onFolderAfterUpdate,
        onFolderBeforeDelete,
        onFolderAfterDelete,

        async get(id, disablePermissions) {
            // If permissions are disabled, execute the use case without applying folder-level permissions logic, returning the raw folder data from the database.
            if (disablePermissions) {
                return await getFolderUseCaseWithoutPermissions.execute({ id });
            }
            return await getFolderUseCase.execute({ id });
        },

        async list({ disablePermissions, ...params }: ListFoldersParams) {
            // If permissions are disabled, execute the use case without applying folder-level permissions logic, returning the raw folder data from the database.
            if (disablePermissions) {
                return await listFoldersUseCaseWithoutPermissions.execute(params);
            }
            return await listFoldersUseCase.execute(params);
        },

        async listAll(params) {
            return await this.list({
                ...params,
                limit: FIXED_FOLDER_LISTING_LIMIT
            });
        },

        async getFolderHierarchy(params) {
            return await getFolderHierarchyUseCase.execute(params);
        },

        async create(data) {
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
            return getAncestorsUseCase.execute({ folder });
        },

        /**
         * @deprecated use `getAncestors` instead
         */
        async getFolderWithAncestors(id: string) {
            const folder = await this.get(id);
            return this.getAncestors(folder);
        },

        async listFolderLevelPermissionsTargets() {
            return await listFolderLevelPermissionsTargetsUseCase.execute();
        }
    };
};
