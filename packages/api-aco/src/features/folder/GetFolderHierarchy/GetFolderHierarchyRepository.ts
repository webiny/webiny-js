import { Result } from "@webiny/feature/api";
import {
    GetFolderHierarchyRepository as RepositoryAbstraction,
    type IGetFolderHierarchyRepository
} from "./abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { FolderModel } from "~/domain/folder/abstractions.js";
import type {
    CmsEntryFolder,
    Folder,
    GetFolderHierarchyParams,
    GetFolderHierarchyResponse
} from "~/folder/folder.types.js";
import { EntryToFolderMapper } from "../shared/EntryToFolderMapper.js";
import { FolderPersistenceError } from "~/domain/folder/errors.js";
import { ROOT_FOLDER } from "~/constants.js";

const FIXED_FOLDER_LISTING_LIMIT = 10_000;

class GetFolderHierarchyRepositoryImpl implements IGetFolderHierarchyRepository {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private folderModel: FolderModel.Interface
    ) {}

    async execute(
        params: GetFolderHierarchyParams
    ): Promise<Result<GetFolderHierarchyResponse, RepositoryAbstraction.Error>> {
        const parents: Folder[] = [];
        const siblings: Folder[] = [];

        // Get root folders (siblings at root level)
        const rootFoldersResult = await this.listLatestEntries.execute<CmsEntryFolder>(
            this.folderModel,
            {
                where: {
                    values: {
                        type: params.type,
                        parentId: null
                    }
                },
                limit: FIXED_FOLDER_LISTING_LIMIT
            }
        );

        if (rootFoldersResult.isFail()) {
            return Result.fail(new FolderPersistenceError(rootFoldersResult.error));
        }

        const { entries: rootEntries } = rootFoldersResult.value;
        siblings.push(...rootEntries.map(entry => EntryToFolderMapper.toFolder(entry)));

        if (params.id === ROOT_FOLDER) {
            return Result.ok({
                parents,
                siblings
            });
        }

        // Get the folder by id
        const folderResult = await this.getEntryById.execute<CmsEntryFolder>(
            this.folderModel,
            params.id
        );

        if (folderResult.isFail()) {
            return Result.fail(new FolderPersistenceError(folderResult.error));
        }

        const folder = EntryToFolderMapper.toFolder(folderResult.value);
        parents.push(folder);

        // Recursively get all parent folders
        const getFolderParentResult = await this.getFolderParent(folder, parents);
        if (getFolderParentResult.isFail()) {
            return Result.fail(getFolderParentResult.error);
        }

        // Get all child folders of all parents (these are siblings at different levels)
        const parentIds = parents.map(f => f.id);

        const childFoldersResult = await this.listLatestEntries.execute<CmsEntryFolder>(
            this.folderModel,
            {
                where: {
                    id_not_in: parentIds,
                    values: {
                        type: folder.type,
                        parentId_in: parentIds
                    }
                },
                limit: FIXED_FOLDER_LISTING_LIMIT
            }
        );

        if (childFoldersResult.isFail()) {
            return Result.fail(new FolderPersistenceError(childFoldersResult.error));
        }

        const { entries: childEntries } = childFoldersResult.value;
        siblings.push(...childEntries.map(entry => EntryToFolderMapper.toFolder(entry)));

        return Result.ok({
            parents,
            siblings
        });
    }

    private async getFolderParent(
        folder: Folder,
        parents: Folder[]
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        let currentFolder = folder;

        while (currentFolder.parentId) {
            const parentResult = await this.getEntryById.execute<CmsEntryFolder>(
                this.folderModel,
                currentFolder.parentId
            );

            if (parentResult.isFail()) {
                return Result.fail(new FolderPersistenceError(parentResult.error));
            }

            const parentFolder = EntryToFolderMapper.toFolder(parentResult.value);
            parents.push(parentFolder);
            currentFolder = parentFolder;
        }

        return Result.ok();
    }
}

export const GetFolderHierarchyRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFolderHierarchyRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, ListLatestEntriesUseCase, FolderModel]
});
