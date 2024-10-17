import { makeAutoObservable } from "mobx";
import { IUpdateFolderRepository } from "./IUpdateFolderRepository";
import { FoldersCache } from "../cache";
import { Folder } from "../Folder";
import { IUpdateFolderGateway } from "./IUpdateFolderGateway";
import { FolderDto } from "./FolderDto";

export class UpdateFolderRepository implements IUpdateFolderRepository {
    private cache: FoldersCache;
    private gateway: IUpdateFolderGateway;

    constructor(cache: FoldersCache, gateway: IUpdateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    async execute(folder: Folder) {
        const dto: FolderDto = {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            parentId: folder.parentId
        };

        await this.gateway.execute(dto);
        await this.cache.update(folder.id, Folder.create(folder));
    }
}
