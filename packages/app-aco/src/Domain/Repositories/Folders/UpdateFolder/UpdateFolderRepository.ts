import { IUpdateFolderRepository } from "./IUpdateFolderRepository";
import { IUpdateFolderGateway } from "~/Gateways";
import { Folder, FolderDTO } from "~/Domain/Models";
import { FoldersCache } from "~/Domain/Caches";

export class UpdateFolderRepository implements IUpdateFolderRepository {
    private cache: FoldersCache;
    private gateway: IUpdateFolderGateway;

    constructor(cache: FoldersCache, gateway: IUpdateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(folder: FolderDTO) {
        const item = await this.gateway.execute(folder);
        await this.cache.update(item.id, Folder.create(item));
    }
}
