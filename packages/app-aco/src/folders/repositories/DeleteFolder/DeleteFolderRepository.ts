import { IDeleteFolderRepository } from "./IDeleteFolderRepository";
import { FoldersCache } from "~/folders/cache";
import { IDeleteFolderGateway } from "~/folders/gateways";

export class DeleteFolderRepository implements IDeleteFolderRepository {
    private cache: FoldersCache;
    private gateway: IDeleteFolderGateway;

    constructor(cache: FoldersCache, gateway: IDeleteFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(id: string) {
        await this.gateway.execute(id);
        await this.cache.remove(id);
    }
}
