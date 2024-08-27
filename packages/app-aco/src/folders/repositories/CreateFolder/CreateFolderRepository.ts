import { ICreateFolderRepository } from "./ICreateFolderRepository";
import { Folder } from "~/folders/domain";
import { CreateFolderGraphQLMapper, ICreateFolderGateway } from "~/folders/gateways";
import { FoldersCache } from "~/folders/cache";

export class CreateFolderRepository implements ICreateFolderRepository {
    private cache: FoldersCache;
    private gateway: ICreateFolderGateway;

    constructor(cache: FoldersCache, gateway: ICreateFolderGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(folder: Folder) {
        const mapper = new CreateFolderGraphQLMapper();
        const response = await this.gateway.execute(mapper.toGraphQLDTO(folder));
        await this.cache.set(Folder.create(response));
    }
}
