import { IGetFolderRepository } from "./IGetFolderRepository";
import { FoldersCache } from "~/folders/cache";
import { Folder } from "~/folders/domain";
import { IGetFolderGateway } from "~/folders/gateways";

export class GetFolderRepository implements IGetFolderRepository {
    private cache: FoldersCache;
    private gateway: IGetFolderGateway;

    constructor(cache: FoldersCache, gateway: IGetFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(id: string) {
        const response = await this.gateway.execute(id);
        await this.cache.set(Folder.create(response));
    }
}
