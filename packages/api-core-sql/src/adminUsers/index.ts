import type { Knex } from "knex";
import type {
    AdminUser,
    AdminUsersStorageOperations,
    StorageOperationsGetUserParams,
    StorageOperationsListUsersParams
} from "@webiny/api-core/types/users.js";
import WebinyError from "@webiny/error";
import type { TableManager } from "~/TableManager.js";
import { sortItems } from "~/sortItems.js";

const TABLE_NAME = "webiny_core_admin_users";

interface IAdminUserRow {
    id: string;
    tenant: string;
    email: string;
    data: string;
}

const userToRow = (user: AdminUser): IAdminUserRow => {
    return {
        id: user.id,
        tenant: user.tenant,
        email: user.email,
        data: JSON.stringify(user)
    };
};

const rowToUser = <TUser extends AdminUser = AdminUser>(row: IAdminUserRow): TUser => {
    return JSON.parse(row.data) as TUser;
};

interface CreateStorageOperationsParams {
    knex: Knex;
    tableManager: TableManager;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): AdminUsersStorageOperations => {
    const { knex, tableManager } = params;

    const ensureTable = () => {
        return tableManager.ensure(TABLE_NAME, table => {
            table.text("id").notNullable();
            table.text("tenant").notNullable();
            table.text("email").notNullable();
            table.text("data").notNullable();

            table.primary(["tenant", "id"]);
            table.unique(["tenant", "email"]);
        });
    };

    const query = () => {
        return knex<IAdminUserRow>(tableManager.resolve(TABLE_NAME));
    };

    return {
        async getUser<TUser extends AdminUser = AdminUser>(
            params: StorageOperationsGetUserParams
        ): Promise<TUser | null> {
            await ensureTable();

            const {
                where: { tenant, id, email }
            } = params;

            try {
                if (id) {
                    const row = await query().where("tenant", tenant).andWhere("id", id).first();

                    return row ? rowToUser<TUser>(row) : null;
                }

                const row = await query()
                    .where("tenant", tenant)
                    .andWhere("email", email as string)
                    .first();

                return row ? rowToUser<TUser>(row) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load user.",
                    code: "GET_ADMIN_USERS_ERROR",
                    data: { id, email }
                });
            }
        },

        async listUsers<TUser extends AdminUser = AdminUser>(
            params: StorageOperationsListUsersParams
        ): Promise<TUser[]> {
            await ensureTable();

            const { where, sort } = params;

            try {
                const rows = await query().where("tenant", where.tenant);

                let items = rows.map(row => rowToUser<TUser>(row));

                items = sortItems(items, sort);

                const { id_in } = where;

                if (Array.isArray(id_in)) {
                    return items.filter(item => id_in.includes(item.id));
                }

                return items;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list users.",
                    code: "LIST_ADMIN_USERS_ERROR"
                });
            }
        },

        async createUser<TUser extends AdminUser = AdminUser>({
            user
        }: {
            user: TUser;
        }): Promise<TUser> {
            await ensureTable();

            try {
                const row = userToRow(user);
                await query().insert(row);

                return user;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create admin user.",
                    code: "CREATE_ADMIN_USER_ERROR",
                    data: { user }
                });
            }
        },

        async updateUser<TUser extends AdminUser = AdminUser>({
            user
        }: {
            user: TUser;
        }): Promise<TUser> {
            await ensureTable();

            try {
                const row = userToRow(user);
                await query().where("tenant", user.tenant).andWhere("id", user.id).update(row);

                return user;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update user.",
                    code: "UPDATE_ADMIN_USER_ERROR",
                    data: { user }
                });
            }
        },

        async deleteUser<TUser extends AdminUser = AdminUser>({
            user
        }: {
            user: TUser;
        }): Promise<void> {
            await ensureTable();

            try {
                await query().where("tenant", user.tenant).andWhere("id", user.id).delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete user.",
                    code: "DELETE_ADMIN_USER_ERROR",
                    data: { user }
                });
            }
        }
    };
};
