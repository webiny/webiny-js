import { makeAutoObservable } from "mobx";
import { ICreateFolderRepository } from "./ICreateFolderRepository";
import { Folder } from "../Folder";
import { FoldersCache } from "../cache";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { FolderDto } from "./FolderDto";

export class CreateFolderRepository implements ICreateFolderRepository {
    private cache: FoldersCache;
    private gateway: ICreateFolderGateway;

    constructor(cache: FoldersCache, gateway: ICreateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    async execute(folder: Folder) {
        const dto: FolderDto = {
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            type: folder.type,
            parentId: folder.parentId
        };

        const result = await this.gateway.execute(dto);
        await this.cache.set(Folder.create(result));
    }
}
