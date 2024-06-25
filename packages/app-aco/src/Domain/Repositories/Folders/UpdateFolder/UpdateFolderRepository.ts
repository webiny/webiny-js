import { IUpdateFolderRepository } from "./IUpdateFolderRepository";
import { IUpdateFolderGateway } from "~/Gateways";
import { Folder } from "~/Domain/Models";
import { FoldersCache } from "~/Domain/Caches";
import { FolderItem } from "~/types";

export class UpdateFolderRepository implements IUpdateFolderRepository {
    private cache: FoldersCache;
    private gateway: IUpdateFolderGateway;

    constructor(cache: FoldersCache, gateway: IUpdateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(folder: FolderItem) {
        const item = await this.gateway.execute(folder);
        await this.cache.update(item.id, Folder.create(item));
    }
}
