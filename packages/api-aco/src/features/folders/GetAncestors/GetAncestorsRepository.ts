import { Result } from "@webiny/feature/api";
import {
    GetAncestorsRepository as RepositoryAbstraction,
    type IGetAncestorsRepository,
    type GetAncestorsParams
} from "./abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { FolderModel } from "~/domain/folder/abstractions.js";
import type { Folder } from "~/folder/folder.types.js";
import { EntryToFolderMapper } from "../shared/EntryToFolderMapper.js";
import { FolderPersistenceError } from "~/domain/folder/errors.js";
import { ROOT_FOLDER } from "~/constants.js";

class GetAncestorsRepositoryImpl implements IGetAncestorsRepository {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private folderModel: FolderModel.Interface
    ) {}

    async execute(params: GetAncestorsParams): Promise<Result<Folder[], RepositoryAbstraction.Error>> {
        const { folder } = params;

        // No folder found: return an empty array
        if (!folder) {
            return Result.ok([]);
        }

        // The folder has no parent (it's at root level): return an array with the folder
        if (!folder.parentId) {
            return Result.ok([folder]);
        }

        // Construct paths for all ancestors of the folder
        const parts = folder.path.split("/").slice(1);
        const paths = parts.map((_, index) => {
            return [ROOT_FOLDER, ...parts.slice(0, index + 1)].join("/");
        });

        // Retrieve all folders that match the specified type and any of the constructed paths
        const result = await this.listLatestEntries.execute(this.folderModel, {
            where: {
                type: folder.type,
                path_in: paths
            }
        });

        if (result.isFail()) {
            return Result.fail(new FolderPersistenceError(result.error));
        }

        const [entries] = result.value;
        const folders = entries.map(entry => EntryToFolderMapper.toFolder(entry));

        // Create a Map with folders, using folder.id as key
        const folderMap = new Map<string, Folder>();
        folders.forEach(f => folderMap.set(f.id, f));

        const findParents = (next: Folder[], current: Folder): Folder[] => {
            // No folder found: return the result
            if (!current) {
                return next;
            }

            // Push the current folder into the accumulator array
            next.push(current);

            // No parentId found: return the result
            if (!current.parentId) {
                return next;
            }

            const parent = folderMap.get(current.parentId);

            // No parent found: return the result
            if (!parent) {
                return next;
            }

            // Go ahead and find parent for the current parent
            return findParents(next, parent);
        };

        // Recursively find parents for a given folder id
        const ancestors = findParents([], folder);
        return Result.ok(ancestors);
    }
}

export const GetAncestorsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetAncestorsRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, FolderModel]
});
