import { makeAutoObservable } from "mobx";
import { FoldersCache } from "../cache";
import { Folder } from "../Folder";
import { IListFoldersGateway } from "./IListFoldersGateway";
import { IListFoldersRepository } from "./IListFoldersRepository";

export class ListFoldersRepository implements IListFoldersRepository {
    private cache: FoldersCache;
    private gateway: IListFoldersGateway;

    constructor(cache: FoldersCache, gateway: IListFoldersGateway) {
        this.cache = cache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    async execute(type: string) {
        const items = await this.gateway.execute(type);
        await this.cache.setMultiple(items.map(item => Folder.create(item)));
    }
}
