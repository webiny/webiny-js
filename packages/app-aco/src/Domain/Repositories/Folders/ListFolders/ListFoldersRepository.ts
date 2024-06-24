import { IListFoldersRepository } from "./IListFoldersRepository";
import { IListFoldersGateway } from "~/Gateways";
import { FoldersCache } from "~/Domain/Caches";
import { Folder } from "~/Domain/Models";

export class ListFoldersRepository implements IListFoldersRepository {
    private readonly type: string;
    private cache: FoldersCache;
    private gateway: IListFoldersGateway;

    constructor(type: string, cache: FoldersCache, gateway: IListFoldersGateway) {
        this.type = type;
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute() {
        const items = await this.gateway.execute(this.type);
        await this.cache.setMultiple(items.map(item => Folder.create(item)));
    }
}
