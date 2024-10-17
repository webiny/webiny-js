import type {
    IListGroupsRepository,
    ListGroupsRepositoryParams
} from "./abstractions/IListGroupsRepository";
import type { Group, SecurityStorageOperations } from "~/types";

export class ListGroupsRepository implements IListGroupsRepository {
    private storageOperations: SecurityStorageOperations;

    constructor(storageOperations: SecurityStorageOperations) {
        this.storageOperations = storageOperations;
    }

    async execute(params: ListGroupsRepositoryParams): Promise<Group[]> {
        return await this.storageOperations.listGroups(params);
    }
}
