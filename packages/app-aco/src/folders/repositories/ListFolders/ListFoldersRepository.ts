import { IListFoldersRepository } from "./IListFoldersRepository";
import { IListFoldersGateway } from "~/folders/gateways";
import { FoldersCache } from "~/folders/cache";
import { Folder } from "~/folders/domain";

export class ListFoldersRepository implements IListFoldersRepository {
    private cache: FoldersCache;
    private gateway: IListFoldersGateway;

    constructor(cache: FoldersCache, gateway: IListFoldersGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(type: string) {
        const items = await this.gateway.execute(type);
        await this.cache.setMultiple(items.map(item => Folder.create(item)));
    }
}
