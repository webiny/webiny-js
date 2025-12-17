import { Result } from "@webiny/feature/api";
import {
    CreateFolderRepository as RepositoryAbstraction,
    type ICreateFolderRepository
} from "./abstractions.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { FolderModel } from "~/domain/folder/abstractions.js";
import type { CreateFolderParams, Folder } from "~/folder/folder.types.js";
import { EntryToFolderMapper } from "../shared/EntryToFolderMapper.js";
import { FolderPersistenceError, FolderValidationError } from "~/domain/folder/errors.js";
import { Path } from "~/utils/Path.js";

class CreateFolderRepositoryImpl implements ICreateFolderRepository {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private folderModel: FolderModel.Interface
    ) {}

    async execute(data: CreateFolderParams): Promise<Result<Folder, RepositoryAbstraction.Error>> {
        // Check if folder already exists
        const checkResult = await this.checkExistingFolder({
            type: data.type,
            slug: data.slug,
            parentId: data.parentId
        });

        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        // Create folder path
        const pathResult = await this.createFolderPath({
            slug: data.slug,
            parentId: data.parentId
        });

        if (pathResult.isFail()) {
            return Result.fail(pathResult.error);
        }

        // Create the entry
        const result = await this.createEntry.execute(this.folderModel, {
            ...data,
            parentId: data.parentId || null,
            path: pathResult.value
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new FolderValidationError(result.error.message));
            }
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const folder = EntryToFolderMapper.toFolder(result.value);
        return Result.ok(folder);
    }

    private async checkExistingFolder(params: {
        type: string;
        slug: string;
        parentId?: string | null;
        excludeId?: string;
    }): Promise<Result<void, RepositoryAbstraction.Error>> {
        const { type, slug, parentId, excludeId } = params;

        const result = await this.listLatestEntries.execute(this.folderModel, {
            where: {
                latest: true,
                type,
                slug,
                parentId,
                ...(excludeId ? { id_not: excludeId } : {})
            },
            limit: 1
        });

        if (result.isFail()) {
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const [entries] = result.value;

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

        const parentResult = await this.getEntryById.execute(this.folderModel, parentId);

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

export const CreateFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateFolderRepositoryImpl,
    dependencies: [CreateEntryUseCase, ListLatestEntriesUseCase, GetEntryByIdUseCase, FolderModel]
});
