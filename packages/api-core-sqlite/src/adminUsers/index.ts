import WebinyError from "@webiny/error";
import type { Database } from "@webiny/db-sqlite";
import type {
    AdminUser,
    AdminUsersStorageOperations,
    StorageOperationsCreateUserParams,
    StorageOperationsDeleteUserParams,
    StorageOperationsGetUserParams,
    StorageOperationsListUsersParams,
    StorageOperationsUpdateUserParams
} from "@webiny/api-core/types/users.js";
import { findByGsi1Sk, listByGsi1 } from "../utils/scan.js";
import { deleteRow, getRow, upsertRow } from "../utils/row.js";

export interface CreateAdminUsersStorageOperationsParams {
    db: Database;
}

const userKey = (tenant: string, id: string) => ({
    pk: `T#${tenant}#ADMIN_USER#${id}`,
    sk: "A"
});

const sortItems = <T>(items: T[], sort?: string[]): T[] => {
    if (!sort || sort.length === 0) {
        return items;
    }
    // The DDB version uses a shared `sortItems` helper; for the most common
    // sort directives we replicate a minimal subset. Tests will catch
    // mismatches; we expand on demand.
    return [...items].sort((a, b) => {
        for (const directive of sort) {
            const [field, direction] = directive.split("_");
            const dir = direction === "DESC" ? -1 : 1;
            const av = (a as Record<string, unknown>)[field!];
            const bv = (b as Record<string, unknown>)[field!];
            if (av === bv) {
                continue;
            }
            if (av === undefined || av === null) {
                return 1;
            }
            if (bv === undefined || bv === null) {
                return -1;
            }
            const aStr = String(av);
            const bStr = String(bv);
            if (aStr === bStr) {
                continue;
            }
            return aStr < bStr ? -dir : dir;
        }
        return 0;
    });
};

export const createStorageOperations = (
    params: CreateAdminUsersStorageOperationsParams
): AdminUsersStorageOperations => {
    const { db } = params;

    return {
        async getUser<TUser extends AdminUser = AdminUser>(
            p: StorageOperationsGetUserParams
        ): Promise<TUser | null> {
            const { where } = p;
            try {
                if (where.id && where.tenant) {
                    return await getRow<TUser>(db, userKey(where.tenant, where.id));
                }
                if (where.email && where.tenant) {
                    return await findByGsi1Sk<TUser>(
                        db,
                        `T#${where.tenant}#ADMIN_USERS`,
                        where.email
                    );
                }
                return null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load user.",
                    code: "GET_ADMIN_USERS_ERROR",
                    data: { where }
                });
            }
        },

        async listUsers<TUser extends AdminUser = AdminUser>(
            p: StorageOperationsListUsersParams
        ): Promise<TUser[]> {
            const { where, sort } = p;
            try {
                let users = await listByGsi1<TUser>(db, {
                    gsi1Pk: `T#${where.tenant}#ADMIN_USERS`
                });
                if (Array.isArray(where.id_in)) {
                    const idIn = where.id_in;
                    users = users.filter(u => idIn.includes(u.id));
                }
                return sortItems(users, sort);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list users.",
                    code: "LIST_ADMIN_USERS_ERROR"
                });
            }
        },

        async createUser<TUser extends AdminUser = AdminUser>(
            p: StorageOperationsCreateUserParams<TUser>
        ): Promise<TUser> {
            const { user } = p;
            try {
                await upsertRow(db, userKey(user.tenant, user.id), user, {
                    gsi1Pk: `T#${user.tenant}#ADMIN_USERS`,
                    gsi1Sk: user.email,
                    gsiTenantPk: user.tenant
                });
                return user;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create admin user.",
                    code: "CREATE_ADMIN_USER_ERROR",
                    data: { id: user.id }
                });
            }
        },

        async updateUser<TUser extends AdminUser = AdminUser>(
            p: StorageOperationsUpdateUserParams<TUser>
        ): Promise<TUser> {
            const { user } = p;
            try {
                await upsertRow(db, userKey(user.tenant, user.id), user, {
                    gsi1Pk: `T#${user.tenant}#ADMIN_USERS`,
                    gsi1Sk: user.email,
                    gsiTenantPk: user.tenant
                });
                return user;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update user.",
                    code: "UPDATE_ADMIN_USER_ERROR",
                    data: { id: user.id }
                });
            }
        },

        async deleteUser<TUser extends AdminUser = AdminUser>(
            p: StorageOperationsDeleteUserParams<TUser>
        ): Promise<void> {
            const { user } = p;
            await deleteRow(db, userKey(user.tenant, user.id));
        }
    };
};
