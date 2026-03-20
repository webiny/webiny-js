import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { StorageApiKey, StorageRole, StorageTeam } from "@webiny/api-core/types/security.js";

export interface IRoleEntityAttributes extends IStandardEntityAttributes<StorageRole> {
    TYPE: string;
}
export type IRoleEntity = IEntity<IRoleEntityAttributes>;

export interface ITeamEntityAttributes extends IStandardEntityAttributes<StorageTeam> {
    TYPE: string;
}
export type ITeamEntity = IEntity<ITeamEntityAttributes>;

export interface IApiKeyEntityAttributes extends IStandardEntityAttributes<StorageApiKey> {
    TYPE: string;
}
export type IApiKeyEntity = IEntity<IApiKeyEntityAttributes>;
