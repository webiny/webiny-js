import type { GetAncestorsParams } from "./abstractions.js";
import { GetAncestorsUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Folder } from "~/folder/folder.types.js";
import { ROOT_FOLDER } from "~/constants.js";
import { createImplementation } from "@webiny/di-container";
import { ListFoldersUseCase } from "~/features/folders/ListFolders/index.js";

class GetAncestorsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listFoldersUseCase: ListFoldersUseCase.Interface) {}

    public async execute(params: GetAncestorsParams): Promise<Folder[]> {
        const { folder } = params;

        const folders = await this.listFolders(folder);

        // Create a Map with folders, using folder.id as key
        const folderMap = new Map<string, Folder>();
        folders.forEach(folder => folderMap.set(folder.id, folder));

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

        // No folder found: return an empty array
        if (!folder) {
            return [];
        }

        // The folder has no parent (it's at root level): return an array with the folder
        if (!folder.parentId) {
            return [folder];
        }

        // Recursively find parents for a given folder id
        return findParents([], folder);
    }

    private async listFolders(folder: Folder): Promise<Folder[]> {
        // Construct paths for all ancestors of the folder
        const parts = folder.path.split("/").slice(1);
        const paths = parts.map((_, index) => {
            return [ROOT_FOLDER, ...parts.slice(0, index + 1)].join("/");
        });

        // Retrieve all folders that match the specified type and any of the constructed paths
        const [folders] = await this.listFoldersUseCase.execute({
            where: {
                type: folder.type,
                path_in: paths
            }
        });

        return folders;
    }
}

export const GetAncestorsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetAncestorsUseCaseImpl,
    dependencies: [ListFoldersUseCase]
});
