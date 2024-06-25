import { ICreateFolderRepository } from "./ICreateFolderRepository";
import { ICreateFolderGateway } from "~/Gateways";
import { Folder } from "~/Domain/Models";
import { FoldersCache } from "~/Domain/Caches";
import { FolderItem } from "~/types";

export class CreateFolderRepository implements ICreateFolderRepository {
    private cache: FoldersCache;
    private gateway: ICreateFolderGateway;

    constructor(cache: FoldersCache, gateway: ICreateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(folder: FolderItem) {
        const response = await this.gateway.execute(folder);
        await this.cache.set(Folder.create(response));
    }
}
