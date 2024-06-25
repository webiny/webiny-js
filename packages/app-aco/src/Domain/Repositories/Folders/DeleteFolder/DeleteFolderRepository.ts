import { IDeleteFolderRepository } from "./IDeleteFolderRepository";
import { IDeleteFolderGateway } from "~/Gateways";
import { FoldersCache } from "~/Domain/Caches";
import { FolderItem } from "~/types";

export class DeleteFolderRepository implements IDeleteFolderRepository {
    private cache: FoldersCache;
    private gateway: IDeleteFolderGateway;

    constructor(cache: FoldersCache, gateway: IDeleteFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(folder: FolderItem) {
        await this.gateway.execute(folder.id);
        await this.cache.remove(folder.id);
    }
}
