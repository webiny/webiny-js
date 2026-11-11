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
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";

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
        const entryId = EntryId.from(id);

        // Get the original folder
        const originalResult = await this.getEntryById.execute<CmsEntryFolder>(
            this.folderModel,
            entryId.toString()
        );

        if (originalResult.isFail()) {
            return Result.fail(new FolderPersistenceError(originalResult.error));
        }

        const original = EntryToFolderMapper.toFolder(originalResult.value);

        // Security: `type` and `path` are never taken from the input. The GraphQL input accepts
        // them, but changing them would move the folder into another app or corrupt the tree.
        const input: UpdateFolderParams & Partial<Pick<Folder, "type" | "path">> = { ...data };
        delete input.type;
        delete input.path;

        if (input.parentId && input.parentId !== original.parentId) {
            const parentResult = await this.validateNewParent(original, input.parentId);
            if (parentResult.isFail()) {
                return Result.fail(parentResult.error);
            }
        }

        // Check if folder with new slug already exists
        const checkResult = await this.checkExistingFolder({
            id,
            type: original.type,
            slug: input.slug || original.slug,
            parentId: input.parentId !== undefined ? input.parentId : original.parentId
        });

        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        // Create new path if slug or parentId changed
        const pathResult = await this.createFolderPath({
            slug: input.slug || original.slug,
            parentId: input.parentId !== undefined ? input.parentId : original.parentId
        });

        if (pathResult.isFail()) {
            return Result.fail(pathResult.error);
        }

        const result = await this.updateEntry.execute<CmsEntryFolder>(
            this.folderModel,
            entryId.toString(),
            {
                values: {
                    ...input,
                    path: pathResult.value
                }
            }
        );

        if (result.isFail()) {
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const updatedFolder = EntryToFolderMapper.toFolder(result.value);
        return Result.ok(updatedFolder);
    }

    /**
     * Security: the new parent must be a folder of the same type, and must not be the folder
     * itself or one of its descendants (that would create a cycle in the tree).
     */
    private async validateNewParent(
        folder: Folder,
        parentId: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        if (parentId === folder.id) {
            return Result.fail(new FolderValidationError("A folder cannot be its own parent."));
        }

        const parentResult = await this.getEntryById.execute<CmsEntryFolder>(
            this.folderModel,
            EntryId.from(parentId).toString()
        );
        if (parentResult.isFail()) {
            return Result.fail(new FolderValidationError("Parent folder not found."));
        }

        const parent = EntryToFolderMapper.toFolder(parentResult.value);
        if (parent.type !== folder.type) {
            return Result.fail(
                new FolderValidationError("Parent folder must be of the same type as the folder.")
            );
        }

        // Walk up from the new parent: reaching the folder itself means a cycle.
        const visited = new Set<string>([parent.id]);
        let ancestorId = parent.parentId;
        while (ancestorId && !visited.has(ancestorId)) {
            if (ancestorId === folder.id) {
                return Result.fail(
                    new FolderValidationError(
                        "A folder cannot be moved into one of its own subfolders."
                    )
                );
            }
            visited.add(ancestorId);

            const ancestorResult = await this.getEntryById.execute<CmsEntryFolder>(
                this.folderModel,
                EntryId.from(ancestorId).toString()
            );
            if (ancestorResult.isFail()) {
                break;
            }
            ancestorId = ancestorResult.value.values.parentId ?? null;
        }

        return Result.ok();
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
                entryId_not: id,
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
            EntryId.from(parentId).toString()
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
