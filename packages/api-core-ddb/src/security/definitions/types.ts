import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { Role, StorageApiKey, Team } from "@webiny/api-core/types/security.js";

export interface IRoleEntityAttributes extends IStandardEntityAttributes<Role> {
    TYPE: string;
}
export type IRoleEntity = IEntity<IRoleEntityAttributes>;

export interface ITeamEntityAttributes extends IStandardEntityAttributes<Team> {
    TYPE: string;
}
export type ITeamEntity = IEntity<ITeamEntityAttributes>;

export interface IApiKeyEntityAttributes extends IStandardEntityAttributes<StorageApiKey> {
    TYPE: string;
}
export type IApiKeyEntity = IEntity<IApiKeyEntityAttributes>;
