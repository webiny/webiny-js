import { makeAutoObservable } from "mobx";
import { ICreateFolderRepository } from "./ICreateFolderRepository";
import { Folder } from "../Folder";
import { FoldersCache } from "../cache";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { FolderDto } from "./FolderDto";

export class CreateFolderRepository implements ICreateFolderRepository {
    private cache: FoldersCache;
    private gateway: ICreateFolderGateway;
    private type: string;

    constructor(cache: FoldersCache, gateway: ICreateFolderGateway, type: string) {
        this.cache = cache;
        this.gateway = gateway;
        this.type = type;
        makeAutoObservable(this);
    }

    async execute(folder: Folder) {
        const dto: FolderDto = {
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            type: this.type,
            parentId: folder.parentId
        };

        const result = await this.gateway.execute(dto);
        await this.cache.set(Folder.create(result));
    }
}
