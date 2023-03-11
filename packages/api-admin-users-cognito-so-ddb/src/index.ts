import { AdminUsersStorageOperations, CreateAdminUsersStorageOperations, ENTITIES } from "~/types";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createSystemEntity, createUserEntity } from "~/definitions/entities";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { get } from "@webiny/db-dynamodb/utils/get";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import {
    AdminUser,
    StorageOperationsGetUserParams,
    StorageOperationsListUsersParams
} from "@webiny/api-admin-users-cognito/types";

const reservedFields = ["PK", "SK", "index", "data"];
const cleanupAttributes = ["TYPE"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name)) {
        throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
            name
        });
    }
};

export const createStorageOperations: CreateAdminUsersStorageOperations = params => {
    const { table: tableName, documentClient, attributes } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({
        table: tableName,
        documentClient
    });

    const entities = {
        system: createSystemEntity(table, attributes ? attributes[ENTITIES.SYSTEM] : {}),
        users: createUserEntity(table)
    };

    const createUserKeys = (user: Pick<AdminUser, "tenant" | "id">) => ({
        PK: `T#${user.tenant}#ADMIN_USER#${user.id}`,
        SK: `A`
    });

    const createUserGSIKeys = (user: AdminUser) => ({
        GSI1_PK: `T#${user.tenant}#ADMIN_USERS`,
        GSI1_SK: user.email
    });

    const createSystemKeys = (tenant: string) => ({
        PK: `T#${tenant}#SYSTEM`,
        SK: "ADMIN_USERS"
    });

    const storageOperations: AdminUsersStorageOperations = {
        getTable() {
            return table;
        },
        getEntities() {
            return entities;
        },
        async createUser({ user }) {
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
        async createSystemData({ system }) {
            const keys = createSystemKeys(system.tenant);
            try {
                await entities.system.put({
                    ...keys,
                    TYPE: "adminUsers.system",
                    ...cleanupItem(entities.system, system)
                });
                return system;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create system.",
                    code: "CREATE_SYSTEM_ERROR",
                    data: { keys, system }
                });
            }
        },
        async deleteUser({ user }) {
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
        async getUser<TUser extends AdminUser = AdminUser>({
            where: { tenant, id, email }
        }: StorageOperationsGetUserParams) {
            try {
                if (id) {
                    const response = await get<{ data: TUser }>({
                        entity: entities.users,
                        keys: createUserKeys({ tenant, id })
                    });
                    return response ? response.data : null;
                }

                const response = await queryOne<{ data: TUser }>({
                    entity: entities.users,
                    partitionKey: `T#${tenant}#ADMIN_USERS`,
                    options: {
                        index: "GSI1",
                        eq: email
                    }
                });

                return response ? response.data : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load user.",
                    code: "GET_ADMIN_USERS_ERROR",
                    data: { id, email }
                });
            }
        },
        async getSystemData({ tenant }) {
            const keys = createSystemKeys(tenant);
            try {
                const result = await entities.system.get(keys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entities.system, result.Item, cleanupAttributes);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load system.",
                    code: "GET_SYSTEM_ERROR",
                    data: { keys }
                });
            }
        },
        async listUsers<TUser extends AdminUser = AdminUser>({
            where,
            sort
        }: StorageOperationsListUsersParams) {
            let items;
            try {
                items = await queryAll<{ data: TUser }>({
                    entity: entities.users,
                    partitionKey: `T#${where.tenant}#ADMIN_USERS`,
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list users.",
                    code: "LIST_ADMIN_USERS_ERROR"
                });
            }

            return sortItems({ items, sort }).map(item => item.data);
        },
        async updateUser({ user }) {
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
        },
        async updateSystemData({ system }) {
            const keys = createSystemKeys(system.tenant);
            try {
                await entities.system.put({
                    ...keys,
                    ...cleanupItem(entities.system, system)
                });
                return system;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update system.",
                    code: "UPDATE_SYSTEM_ERROR",
                    data: { keys, system }
                });
            }
        }
    };

    return storageOperations;
};
