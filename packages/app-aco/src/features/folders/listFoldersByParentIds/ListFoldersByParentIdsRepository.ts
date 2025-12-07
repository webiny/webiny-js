import { Folder } from "../Folder.js";
import {
    ListFoldersByParentIdsRepository as RepositoryAbstraction,
    ListFoldersByParentIdsGateway
} from "./abstractions.js";
import { FoldersCache, FoldersContext } from "~/features/folders/abstractions.js";

class ListFoldersByParentIdsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private foldersContext: FoldersContext.Interface,
        private cache: FoldersCache.Interface,
        private gateway: ListFoldersByParentIdsGateway.Interface
    ) {}

    async execute(parentIds: string[]) {
        const items = await this.gateway.execute(this.foldersContext.type, parentIds);
        this.cache.addItems(items.map(item => Folder.create(item)));
    }
}

export const ListFoldersByParentIdsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListFoldersByParentIdsRepositoryImpl,
    dependencies: [FoldersContext, FoldersCache, ListFoldersByParentIdsGateway]
});
