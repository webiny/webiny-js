import { makeAutoObservable } from "mobx";
import { FoldersCache } from "../cache";
import { Folder } from "../Folder";
import { IListFoldersGateway } from "./IListFoldersGateway";
import { IListFoldersRepository } from "./IListFoldersRepository";

export class ListFoldersRepository implements IListFoldersRepository {
    private cache: FoldersCache;
    private gateway: IListFoldersGateway;
    private type: string;

    constructor(cache: FoldersCache, gateway: IListFoldersGateway, type: string) {
        this.cache = cache;
        this.gateway = gateway;
        this.type = type;
        makeAutoObservable(this);
    }

    async execute() {
        const items = await this.gateway.execute(this.type);
        await this.cache.setMultiple(items.map(item => Folder.create(item)));
    }
}
