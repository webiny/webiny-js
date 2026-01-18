import { Result } from "@webiny/feature/api";
import {
    type IUpdateFolderRepository,
    UpdateFolderRepository as RepositoryAbstraction
} from "./abstractions.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { FolderModel } from "~/domain/folder/abstractions.js";
import type { CmsEntryFolder, Folder, UpdateFolderParams } from "~/folder/folder.types.js";
import { EntryToFolderMapper } from "../shared/EntryToFolderMapper.js";
import { FolderPersistenceError, FolderValidationError } from "~/domain/folder/errors.js";
import { Path } from "~/utils/Path.js";

class UpdateFolderRepositoryImpl implements IUpdateFolderRepository {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private folderModel: FolderModel.Interface
    ) {}

    async execute(
        id: string,
        data: UpdateFolderParams
    ): Promise<Result<Folder, RepositoryAbstraction.Error>> {
        // Get the original folder
        const originalResult = await this.getEntryById.execute<CmsEntryFolder>(
            this.folderModel,
            id
        );

        if (originalResult.isFail()) {
            return Result.fail(new FolderPersistenceError(originalResult.error));
        }

        const original = EntryToFolderMapper.toFolder(originalResult.value);

        // Check if folder with new slug already exists
        const checkResult = await this.checkExistingFolder({
            id,
            type: original.type,
            slug: data.slug || original.slug,
            parentId: data.parentId !== undefined ? data.parentId : original.parentId
        });

        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        // Create new path if slug or parentId changed
        const pathResult = await this.createFolderPath({
            slug: data.slug || original.slug,
            parentId: data.parentId !== undefined ? data.parentId : original.parentId
        });

        if (pathResult.isFail()) {
            return Result.fail(pathResult.error);
        }
        
        const result = await this.updateEntry.execute<CmsEntryFolder>(this.folderModel, id, {
            values: {
                ...data,
                path: pathResult.value
            }
        });

        if (result.isFail()) {
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const updatedFolder = EntryToFolderMapper.toFolder(result.value);
        return Result.ok(updatedFolder);
    }

    private async checkExistingFolder(params: {
        id: string;
        type: string;
        slug: string;
        parentId?: string | null;
    }): Promise<Result<void, RepositoryAbstraction.Error>> {
        const { id, type, slug, parentId } = params;

        const result = await this.listLatestEntries.execute<CmsEntryFolder>(this.folderModel, {
            where: {
                latest: true,
                id_not: id,
                values: {
                    type,
                    slug,
                    parentId
                }
            },
            limit: 1
        });

        if (result.isFail()) {
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const { entries } = result.value;

        if (entries.length > 0) {
            return Result.fail(
                new FolderValidationError(
                    `Folder with slug "${slug}" already exists at this level.`
                )
            );
        }

        return Result.ok();
    }

    private async createFolderPath(params: {
        slug: string;
        parentId?: string | null;
    }): Promise<Result<string, RepositoryAbstraction.Error>> {
        const { slug, parentId } = params;

        if (!parentId) {
            return Result.ok(Path.create(slug));
        }

        const parentResult = await this.getEntryById.execute<CmsEntryFolder>(
            this.folderModel,
            parentId
        );

        if (parentResult.isFail()) {
            return Result.fail(
                new FolderPersistenceError(
                    new Error("Parent folder not found. Unable to create the folder path")
                )
            );
        }

        const parentFolder = EntryToFolderMapper.toFolder(parentResult.value);
        return Result.ok(Path.create(slug, parentFolder.path));
    }
}

export const UpdateFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateFolderRepositoryImpl,
    dependencies: [UpdateEntryUseCase, GetEntryByIdUseCase, ListLatestEntriesUseCase, FolderModel]
});
