import {
    AdminUsersContext,
    User,
    UserStorageOperations,
    UserStorageOperationsCreateParams,
    UserStorageOperationsUpdateParams,
    UserStorageOperationsDeleteParams,
    UserStorageOperationsGetParams,
    UserStorageOperationsListParams,
    TenantAccess
} from "@webiny/api-security-admin-users/types";
import { createTable } from "~/definitions/table";
import { createUserEntity } from "~/definitions/userEntity";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, QueryAllParams, queryOne, QueryParams } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { Tenant } from "@webiny/api-tenancy/types";
import { createTokenEntity } from "~/definitions/tokenEntity";
import { DbItem } from "~/types";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { GroupDynamoDbFieldPlugin } from "~/plugins/GroupDynamoDbFieldPlugin";

interface Params {
    context: AdminUsersContext;
}

export class UserStorageOperationsDdb implements UserStorageOperations {
    public async getUser(params: UserStorageOperationsGetParams): Promise<User | null> {
        const { id } = params;
        const keys = {
            PK: this.createPartitionKey(id),
            SK: this.createUserSortKey()
        };

        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return this.cleanupItem(result.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load user.",
                ex.code || "GET_USER_ERROR",
                {
                    keys,
                    id
                }
            );
        }
    }

    public async listUsers(params: UserStorageOperationsListParams): Promise<User[]> {
        const { where, sort } = params;
        if (!where.tenant && !where.id_in) {
            throw new WebinyError(
                `There must be either a tenant or id_in sent when querying for list of users.`,
                "MALFORMED_WHERE_LIST_USERS_ERROR",
                { where }
            );
        }
        if (where.id_in) {
            return this.listUsersByIds(where.id_in);
        }

        let userTenantAccessList: DbItem<TenantAccess>[] = [];
        const queryAllParams = {
            entity: this.linksEntity,
            partitionKey: `T#${where.tenant}`,
            options: {
                index: "GSI1",
                beginsWith: "G#"
            }
        };
        try {
            userTenantAccessList = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot load users via secondary index.",
                ex.code || "LIST_USERS_VIA_SECONDARY_INDEX_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        if (userTenantAccessList.length === 0) {
            return [];
        }

        const batch = userTenantAccessList.map(item => {
            return this.entity.getBatch({
                PK: item.PK,
                SK: "A"
            });
        });

        let users: User[];
        try {
            const results = await batchReadAll<User>({
                table: this.table,
                items: batch
            });
            users = results.map(user => this.cleanupItem(user));
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot load users.",
                ex.code || "LIST_USERS_ERROR"
            );
        }

        const fields = this.context.plugins.byType<GroupDynamoDbFieldPlugin>(
            GroupDynamoDbFieldPlugin.type
        );

        return sortItems<User>({
            items: users,
            sort,
            fields
        });
    }

    public async createUser(params: UserStorageOperationsCreateParams): Promise<User> {
        const { user } = params;
        const keys = {
            PK: this.createUserPartitionKey(user),
            SK: this.createUserSortKey()
        };
        try {
            await this.entity.put({
                ...user,
                TYPE: "security.user",
                ...keys
            });
            return user;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store user to the DDB.",
                ex.code || "CREATE_USER_DDB_ERROR",
                {
                    keys,
                    user
                }
            );
        }
    }

    public async updateUser(params: UserStorageOperationsUpdateParams): Promise<User> {
        const { user, original } = params;
        const keys = {
            PK: this.createUserPartitionKey(user),
            SK: this.createUserSortKey()
        };
        try {
            await this.entity.put({
                ...user,
                ...keys
            });
            return user;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not save user to the DDB.",
                ex.code || "UPDATE_USER_DDB_ERROR",
                {
                    keys,
                    user,
                    original
                }
            );
        }
    }

    public async deleteUser(params: UserStorageOperationsDeleteParams): Promise<User> {
        const { user } = params;

        let items = [];
        try {
            items = await queryAll({
                entity: this.entity,
                partitionKey: this.createUserPartitionKey(user),
                options: {
                    gt: " "
                }
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load users data.",
                ex.code || "LIST_USER_DATA_ERROR",
                {
                    user
                }
            );
        }

        try {
            await batchWriteAll({
                table: this.table,
                items: items.map(item => {
                    return this.entity.deleteBatch({
                        PK: item.PK,
                        SK: item.SK
                    });
                })
            });
            return user;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete user data.",
                ex.code || "DELETE_USER_DATA_ERROR",
                {
                    user
                }
            );
        }
    }
    
    private async listUsersByIds(ids: string[]): Promise<User[]> {
        const items = ids.map(id => {
            return this.entity.getBatch({
                PK: this.createPartitionKey(id),
                SK: this.createUserSortKey()
            });
        });
        try {
            const results = await batchReadAll<User>({
                table: this.table,
                items
            });
            return results.map(item => this.cleanupItem(item));
        } catch (ex) {
            throw new WebinyError(
                ex.messsage || "Cannot batch read users by ID.",
                ex.code || "BATCH_READ_BY_ID_ERROR",
                {
                    ids
                }
            );
        }
    }
    /**
     * There is a need for this method because of the old way of saving the user data.
     */
    private createUserPartitionKey(user: User): string {
        return this.createPartitionKey(user.id || user.login);
    }

    private createPartitionKey(id: string): string {
        return `U#${id}`;
    }

    private createUserSortKey(): string {
        return "A";
    }

}
