import { IUpdateFolderRepository } from "./IUpdateFolderRepository";
import { Folder } from "~/folders/domain";
import { FoldersCache } from "~/folders/cache";
import { IUpdateFolderGateway, UpdateFolderGraphQLMapper } from "~/folders/gateways";

export class UpdateFolderRepository implements IUpdateFolderRepository {
    private cache: FoldersCache;
    private gateway: IUpdateFolderGateway;

    constructor(cache: FoldersCache, gateway: IUpdateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(folder: Folder) {
        const mapper = new UpdateFolderGraphQLMapper();
        const item = await this.gateway.execute(mapper.toGraphQLDTO(folder));
        await this.cache.update(item.id, Folder.create(item));
    }
}
