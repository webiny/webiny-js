import { makeAutoObservable } from "mobx";
import { IDeleteFolderRepository } from "./IDeleteFolderRepository";
import { FoldersCache } from "../cache";
import { Folder } from "../Folder";
import { IDeleteFolderGateway } from "./IDeleteFolderGateway";

export class DeleteFolderRepository implements IDeleteFolderRepository {
    private cache: FoldersCache;
    private gateway: IDeleteFolderGateway;

    constructor(cache: FoldersCache, gateway: IDeleteFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    async execute(folder: Folder) {
        await this.gateway.execute(folder.id);
        await this.cache.remove(folder.id);
    }
}
