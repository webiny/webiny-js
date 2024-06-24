import { IGetFolderRepository } from "./IGetFolderRepository";
import { IGetFolderGateway } from "~/Gateways";
import { FoldersCache } from "~/Domain/Caches";
import { Folder } from "~/Domain/Models";

export class GetFolderRepository implements IGetFolderRepository {
    private cache: FoldersCache;
    private gateway: IGetFolderGateway;

    constructor(cache: FoldersCache, gateway: IGetFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(id: string) {
        const response = await this.gateway.execute(id);
        await this.cache.set(Folder.create(response));
    }
}
