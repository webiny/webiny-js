import { AdminUsersStorageOperations as AdminUsersStorageOperationsAbstraction } from "@webiny/api-core/features/users/shared/storageAbstractions.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb/exports/api/db.js";
import { WebinyError } from "@webiny/error";
import { sortItems } from "@webiny/db-dynamodb";
import { createUserEntity } from "./definitions/entities.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { StorageOperationsGetUserParams } from "@webiny/api-core/types/users.js";
import type { StorageOperationsListUsersParams } from "@webiny/api-core/types/users.js";

const createUserKeys = (user: Pick<AdminUser, "tenant" | "id">) => ({
    PK: `T#${user.tenant}#ADMIN_USER#${user.id}`,
    SK: `A`
});

const createUserGSIKeys = (user: AdminUser) => {
    return {
        GSI1_PK: `T#${user.tenant}#ADMIN_USERS`,
        GSI1_SK: user.email,
        GSI_TENANT: user.tenant
    };
};

class AdminUsersStorageOperationsImpl implements AdminUsersStorageOperationsAbstraction.Interface {
    private readonly client;
    private readonly entities;

    public constructor(
        private readonly tableFactory: DynamoDbTableFactory.Interface,
        private readonly entityFactory: DynamoDbEntityFactory.Interface
    ) {
        this.client = this.tableFactory.create({
            name: process.env.DB_TABLE as string
        });
        this.entities = {
            users: createUserEntity({
                client: this.client,
                entityFactory: this.entityFactory
            })
        };
    }

    public async createUser<TUser extends AdminUser = AdminUser>({
        user
    }: {
        user: TUser;
    }): Promise<TUser> {
        const keys = {
            ...createUserKeys(user),
            ...createUserGSIKeys(user)
        };

        try {
            await this.entities.users.put({
                ...keys,
                TYPE: "adminUsers.user",
                data: user
            });

            return user;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not create admin user.",
                code: "CREATE_ADMIN_USER_ERROR",
                data: { keys }
            });
        }
    }

    public async deleteUser<TUser extends AdminUser = AdminUser>({
        user
    }: {
        user: TUser;
    }): Promise<void> {
        const keys = createUserKeys(user);

        try {
            await this.entities.users.delete(keys);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete group.",
                code: "CREATE_DELETE_ERROR",
                data: { keys, user }
            });
        }
    }

    public async getUser<TUser extends AdminUser = AdminUser>(
        params: StorageOperationsGetUserParams
    ): Promise<TUser | null> {
        const {
            where: { tenant, id, email }
        } = params;
        try {
            if (id) {
                const response = await this.entities.users.get<IStandardEntityAttributes<TUser>>(
                    createUserKeys({ tenant: tenant as string, id })
                );
                return (response?.data as TUser) || null;
            }

            const response = await this.entities.users.queryOne<IStandardEntityAttributes<TUser>>({
                partitionKey: `T#${tenant}#ADMIN_USERS`,
                options: {
                    index: "GSI1",
                    eq: email
                }
            });

            return (response?.data as TUser) || null;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load user.",
                code: "GET_ADMIN_USERS_ERROR",
                data: { id, email }
            });
        }
    }

    public async listUsers<TUser extends AdminUser = AdminUser>({
        where,
        sort
    }: StorageOperationsListUsersParams): Promise<TUser[]> {
        let items: TUser[];
        try {
            const ddbItems = await this.entities.users.queryAll<IStandardEntityAttributes<TUser>>({
                partitionKey: `T#${where.tenant}#ADMIN_USERS`,
                options: {
                    index: "GSI1"
                }
            });
            items = ddbItems.map(item => {
                return item.data as TUser;
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list users.",
                code: "LIST_ADMIN_USERS_ERROR"
            });
        }

        return sortItems({ items, sort });
    }

    public async updateUser<TUser extends AdminUser = AdminUser>({
        user
    }: {
        user: TUser;
    }): Promise<TUser> {
        const keys = {
            ...createUserKeys(user),
            ...createUserGSIKeys(user)
        };

        try {
            await this.entities.users.put({
                ...keys,
                TYPE: "adminUsers.user",
                data: user
            });
            return user;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update user.",
                code: "UPDATE_ADMIN_USER_ERROR",
                data: { keys, user }
            });
        }
    }
}

export const AdminUsersStorageOperations =
    AdminUsersStorageOperationsAbstraction.createImplementation({
        implementation: AdminUsersStorageOperationsImpl,
        dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
    });
