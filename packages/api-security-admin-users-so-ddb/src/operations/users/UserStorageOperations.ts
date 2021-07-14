import {
    AdminUsersContext,
    User,
    UserStorageOperations,
    UserStorageOperationsCreateParams,
    UserStorageOperationsUpdateParams,
    UserStorageOperationsDeleteParams,
    UserStorageOperationsGetParams,
    UserStorageOperationsListParams,
    DbItemSecurityUser2Tenant,
    UserStorageOperationsLinkUserToTenantParams,
    Group,
    UserStorageOperationsUnlinkUserFromTenantParams
} from "@webiny/api-security-admin-users/types";
import { createTable } from "~/definitions/table";
import { createUserEntity } from "~/definitions/userEntity";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { createLinksEntity } from "~/definitions/linksEntity";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { Tenant } from "@webiny/api-tenancy/types";

interface Params {
    context: AdminUsersContext;
}

export class UserStorageOperationsDdb implements UserStorageOperations {
    private readonly context: AdminUsersContext;
    private readonly table: Table;
    private readonly entity: Entity<any>;
    private readonly linksEntity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;

        this.table = createTable({
            context
        });

        this.entity = createUserEntity({
            context,
            table: this.table
        });

        this.linksEntity = createLinksEntity({
            context,
            table: this.table
        });
    }

    public async get(params: UserStorageOperationsGetParams): Promise<User | null> {
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

    public async list(params: UserStorageOperationsListParams): Promise<User[]> {
        const { where } = params;

        let userTenantAccessList: DbItemSecurityUser2Tenant[] = [];
        const usersPartitionKey = `T#${where.tenant}`;
        const usersOptions = {
            beginsWith: "G#"
        };
        try {
            userTenantAccessList = await queryAll({
                entity: this.linksEntity,
                partitionKey: usersPartitionKey,
                options: usersOptions
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot load users via secondary index.",
                ex.code || "LIST_USERS_VIA_SECONDARY_INDEX_ERROR",
                {
                    partitionKey: usersPartitionKey,
                    options: usersOptions
                }
            );
        }
        const batch = userTenantAccessList.map(item => {
            return this.entity.getBatch({
                PK: item.PK,
                SK: "A"
            });
        });

        try {
            const users = await batchReadAll<User>({
                table: this.table,
                items: batch
            });
            return users.map(user => this.cleanupItem(user));
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot load users.",
                ex.code || "LIST_USERS_ERROR"
            );
        }
    }

    public async create(params: UserStorageOperationsCreateParams): Promise<User> {
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

    public async update(params: UserStorageOperationsUpdateParams): Promise<User> {
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

    public async delete(params: UserStorageOperationsDeleteParams): Promise<User> {
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

    public async linkUserToTenant(
        params: UserStorageOperationsLinkUserToTenantParams
    ): Promise<void> {
        const { user, group, tenant, link } = params;
        const keys = {
            PK: this.createUserPartitionKey(user),
            SK: this.createLinkSortKey(tenant, group),
            GSI1_PK: this.createGsiPartitionKey(tenant),
            GSI1_SK: this.createGsiSortKey(group, user)
        };

        try {
            await this.linksEntity.put({
                ...keys,
                TYPE: "security.user2tenant",
                ...link
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create user <-> group link.",
                ex.code || "CREATE_USER_LINK_ERROR",
                {
                    link,
                    keys
                }
            );
        }
    }

    public async unlinkUserFromTenant(
        params: UserStorageOperationsUnlinkUserFromTenantParams
    ): Promise<void> {
        const { tenant, user } = params;
        let userTenantAccessList: DbItemSecurityUser2Tenant[] = [];
        const usersPartitionKey = this.createUserPartitionKey(user);
        const usersOptions = {
            beginsWith: `LINK#T#${tenant.id}#G#`,
            limit: 1
        };
        try {
            userTenantAccessList = await queryAll({
                entity: this.linksEntity,
                partitionKey: usersPartitionKey,
                options: usersOptions
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot load users via secondary index.",
                ex.code || "LIST_USERS_VIA_SECONDARY_INDEX_ERROR",
                {
                    partitionKey: usersPartitionKey,
                    options: usersOptions
                }
            );
        }
        if (userTenantAccessList.length === 0) {
            throw new WebinyError("Could not find a relation between the ");
        }
        const keys = {
            PK: userTenantAccessList[0].PK,
            SK: userTenantAccessList[0].SK
        };
        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete link user <-> tenant.",
                ex.code || "DELETE_LINK_USER_TENANT_ERROR",
                {
                    keys,
                    user
                }
            );
        }
    }

    private cleanupItem(item: User & Record<string, any>): User {
        return cleanupItem(this.entity, item);
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

    private createLinkSortKey(tenant: Tenant, group: Group): string {
        return `LINK#T#${tenant.id}#G#${group.slug}`;
    }

    private createGsiPartitionKey(tenant: Tenant): string {
        return `T#${tenant.id}`;
    }

    private createGsiSortKey(group: Group, user: User): string {
        return `G#${group.slug}#U#${user.id || user.login}`;
    }
}
