import type { AdminUsersStorageOperations, CreateAdminUsersStorageOperations } from "./types.js";
import WebinyError from "@webiny/error";
import { createTable, type IStandardEntityAttributes, sortItems } from "@webiny/db-dynamodb";
import { createUserEntity } from "./definitions/entities.js";
import type {
    AdminUser,
    StorageOperationsGetUserAcrossTenantsParams,
    StorageOperationsGetUserParams,
    StorageOperationsListUserRecordsParams,
    StorageOperationsListUsersParams
} from "@webiny/api-core/types/users.js";

export const createStorageOperations: CreateAdminUsersStorageOperations = params => {
    const { table: tableName, documentClient, scopeTenant } = params;

    /** The user with its scope's tenant, checked against the one it carries. */
    const inScope = <T extends AdminUser>(user: T): T => {
        return { ...user, tenant: scopeTenant.getId(user.tenant) };
    };

    const table = createTable({
        name: tableName || (process.env.DB_TABLE as string),
        documentClient
    });

    const entities = {
        users: createUserEntity(table.table)
    };

    const createUserKeys = (user: Pick<AdminUser, "tenant" | "id">) => ({
        PK: `T#${user.tenant}#ADMIN_USER#${user.id}`,
        SK: `A`
    });

    const createUserIndexPartitionKey = (id: string) => `ADMIN_USER#${id}`;

    const createUserGSIKeys = (user: AdminUser) => {
        return {
            GSI1_PK: `T#${user.tenant}#ADMIN_USERS`,
            GSI1_SK: user.email,
            // The user→tenant index: every tenant's record of one user, in one partition.
            GSI2_PK: createUserIndexPartitionKey(user.id),
            GSI2_SK: `T#${user.tenant}`,
            GSI_TENANT: user.tenant
        };
    };

    const storageOperations: AdminUsersStorageOperations = {
        getTable() {
            return table;
        },
        getEntities() {
            return entities;
        },
        async createUser(params) {
            const user = inScope(params.user);
            const keys = {
                ...createUserKeys(user),
                ...createUserGSIKeys(user)
            };

            try {
                await entities.users.put({
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
        },
        async deleteUser(params) {
            const user = inScope(params.user);
            const keys = createUserKeys(user);

            try {
                await entities.users.delete(keys);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete group.",
                    code: "CREATE_DELETE_ERROR",
                    data: { keys, user }
                });
            }
        },
        async getUser<TUser extends AdminUser = AdminUser>(
            params: StorageOperationsGetUserParams
        ): Promise<TUser | null> {
            const {
                where: { id, email }
            } = params;
            const tenant = scopeTenant.getId(params.where.tenant);
            try {
                if (id) {
                    const response = await entities.users.get<IStandardEntityAttributes<TUser>>(
                        createUserKeys({ tenant, id })
                    );
                    return (response?.data as TUser) || null;
                }

                const response = await entities.users.queryOne<IStandardEntityAttributes<TUser>>({
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
        },
        // Cross-tenant by design: one user's records in the given tenants, not the scope's tenant.
        async getUserAcrossTenants<TUser extends AdminUser = AdminUser>(
            params: StorageOperationsGetUserAcrossTenantsParams
        ): Promise<TUser[]> {
            const { id, tenants } = params;
            if (tenants.length === 0) {
                return [];
            }

            try {
                // The batch reader splits the keys into chunks of 100 (the BatchGetItem limit).
                const reader = entities.users.createEntityReader({
                    read: tenants.map(tenant => createUserKeys({ tenant, id }))
                });
                const items = await reader.execute();

                return items
                    .filter(item => !!item?.data)
                    .map(item => {
                        return item.data as unknown as TUser;
                    });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load user across tenants.",
                    code: "GET_ADMIN_USER_ACROSS_TENANTS_ERROR",
                    data: { id, tenants }
                });
            }
        },
        // Cross-tenant by design: every tenant's record of one user.
        async listUserRecords<TUser extends AdminUser = AdminUser>(
            params: StorageOperationsListUserRecordsParams
        ): Promise<TUser[]> {
            const { id } = params;

            try {
                const items = await entities.users.queryAll<IStandardEntityAttributes<TUser>>({
                    partitionKey: createUserIndexPartitionKey(id),
                    options: {
                        index: "GSI2"
                    }
                });

                return items.map(item => item.data as TUser);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list user records.",
                    code: "LIST_ADMIN_USER_RECORDS_ERROR",
                    data: { id }
                });
            }
        },
        async listUsers<TUser extends AdminUser = AdminUser>({
            where,
            sort
        }: StorageOperationsListUsersParams) {
            const tenant = scopeTenant.getId(where.tenant);
            let items: TUser[];
            try {
                const ddbItems = await entities.users.queryAll<IStandardEntityAttributes<TUser>>({
                    partitionKey: `T#${tenant}#ADMIN_USERS`,
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

            const { id_in, teams_in } = where;

            const filtered = items.filter(item => {
                if (Array.isArray(id_in) && !id_in.includes(item.id)) {
                    return false;
                }
                if (Array.isArray(teams_in)) {
                    return (item.teams || []).some(team => teams_in.includes(team));
                }
                return true;
            });

            return sortItems({ items: filtered, sort });
        },
        async updateUser(params) {
            const user = inScope(params.user);
            const keys = {
                ...createUserKeys(user),
                ...createUserGSIKeys(user)
            };

            try {
                await entities.users.put({
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
    };

    return storageOperations;
};
