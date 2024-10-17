import { makeAutoObservable } from "mobx";
import { Folder } from "../Folder";
import { FoldersCache } from "../cache";
import { IGetFolderRepository } from "./IGetFolderRepository";
import { IGetFolderGateway } from "./IGetFolderGateway";

export class GetFolderRepository implements IGetFolderRepository {
    private cache: FoldersCache;
    private gateway: IGetFolderGateway;

    constructor(cache: FoldersCache, gateway: IGetFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        const response = await this.gateway.execute(id);
        await this.cache.set(Folder.create(response));
    }
}
