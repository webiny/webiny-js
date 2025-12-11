import { Folder } from "~/domain/folder/Folder.js";
import {
    ListFoldersRepository as RepositoryAbstraction,
    ListFoldersGateway
} from "./abstractions.js";
import { FoldersCache, FoldersContext } from "~/features/folders/abstractions.js";

class ListFoldersRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private foldersContext: FoldersContext.Interface,
        private cache: FoldersCache.Interface,
        private gateway: ListFoldersGateway.Interface
    ) {}

    async execute() {
        const items = await this.gateway.execute(this.foldersContext.type);
        this.cache.clear();
        this.cache.addItems(items.map(item => Folder.create(item)));
    }
}

export const ListFoldersRepository = RepositoryAbstraction.createImplementation({
    implementation: ListFoldersRepositoryImpl,
    dependencies: [FoldersContext, FoldersCache, ListFoldersGateway]
});
