import type { Group } from "~/types";

export interface GetGroupRepositoryParams {
    where: {
        id?: string;
        slug?: string;
        tenant: string;
    };
}

export interface IGetGroupRepository {
    execute(params: GetGroupRepositoryParams): Promise<Group | null>;
}
