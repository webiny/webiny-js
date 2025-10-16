import type { GetFolderHierarchyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";
import type {
    AcoFolderStorageOperations,
    Folder,
    GetFolderHierarchyParams,
    GetFolderHierarchyResponse
} from "~/folder/folder.types.js";

const FIXED_FOLDER_LISTING_LIMIT = 10_000;

export class GetFolderHierarchyUseCase implements UseCaseAbstraction.Interface {
    constructor(private storageOperations: AcoFolderStorageOperations) {}

    async execute(params: GetFolderHierarchyParams): Promise<GetFolderHierarchyResponse> {
        const parents: Folder[] = [];
        const siblings: Folder[] = [];

        const [rootFolders] = await this.storageOperations.listFolders({
            where: { type: params.type, parentId: null },
            limit: FIXED_FOLDER_LISTING_LIMIT
        });

        siblings.push(...rootFolders);

        if (params.id === ROOT_FOLDER) {
            return {
                parents,
                siblings
            };
        }

        const folder = await this.storageOperations.getFolder({ id: params.id });
        parents.push(folder);

        const getFolderParent = async (folder: Folder) => {
            while (folder.parentId) {
                const parentFolder = await this.storageOperations.getFolder({
                    id: folder.parentId
                });
                parents.push(parentFolder);
                folder = parentFolder;
            }
        };

        await getFolderParent(folder);

        const parentIds = parents.map(folder => folder.id);

        const [childFolders] = await this.storageOperations.listFolders({
            where: { type: folder.type, parentId_in: parentIds, id_not_in: parentIds },
            limit: FIXED_FOLDER_LISTING_LIMIT
        });

        siblings.push(...childFolders);

        return {
            parents,
            siblings
        };
    }
}
