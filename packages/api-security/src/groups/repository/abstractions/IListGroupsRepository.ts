import type { Group } from "~/types";

export interface ListGroupsRepositoryParams {
    where: {
        id_in?: string[];
        slug_in?: string[];
        tenant: string;
    };
    sort?: string[];
}

export interface IListGroupsRepository {
    execute(params: ListGroupsRepositoryParams): Promise<Group[]>;
}
