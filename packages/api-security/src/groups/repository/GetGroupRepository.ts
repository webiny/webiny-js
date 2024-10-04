import type { Group, SecurityStorageOperations } from "~/types";
import type {
    IGetGroupRepository,
    GetGroupRepositoryParams
} from "./abstractions/IGetGroupRepository";

export class GetGroupRepository implements IGetGroupRepository {
    private storageOperations: SecurityStorageOperations;

    constructor(storageOperations: SecurityStorageOperations) {
        this.storageOperations = storageOperations;
    }

    async execute(params: GetGroupRepositoryParams): Promise<Group | null> {
        return await this.storageOperations.getGroup(params);
    }
}
