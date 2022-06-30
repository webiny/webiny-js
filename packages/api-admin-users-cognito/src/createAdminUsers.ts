/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import cloneDeep from "lodash/cloneDeep";
import { createTopic } from "@webiny/pubsub";
import WebinyError from "@webiny/error";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { NotFoundError } from "@webiny/handler-graphql";
import { AdminUser, AdminUsers, AdminUsersStorageOperations, CreatedBy, System } from "./types";
import { createUserLoaders } from "./createAdminUsers/users.loaders";
import { attachUserValidation } from "./createAdminUsers/users.validation";

interface AdminUsersConfig {
    getIdentity(): SecurityIdentity;
    getPermission(name: string): Promise<SecurityPermission | null>;
    getTenant(): string;
    storageOperations: AdminUsersStorageOperations;
    incrementWcpSeats: () => Promise<void>;
    decrementWcpSeats: () => Promise<void>;
}

export const createAdminUsers = ({
    storageOperations,
    getPermission,
    getTenant,
    getIdentity,
    incrementWcpSeats,
    decrementWcpSeats
}: AdminUsersConfig): AdminUsers => {
    const loaders = createUserLoaders({ getTenant, storageOperations });

    const checkPermission = async () => {
        const permission = await getPermission("adminUsers.user");

        if (!permission) {
            throw new NotAuthorizedError();
        }
    };

    const adminUsers: AdminUsers = {
        onUserAfterCreate: createTopic("adminUsers.onAfterCreate"),
        onUserAfterDelete: createTopic("adminUsers.onAfterDelete"),
        onUserAfterUpdate: createTopic("adminUsers.onAfterUpdate"),
        onUserBeforeCreate: createTopic("adminUsers.onBeforeCreate"),
        onUserBeforeDelete: createTopic("adminUsers.onBeforeDelete"),
        onUserBeforeUpdate: createTopic("adminUsers.onBeforeUpdate"),
        onBeforeInstall: createTopic("adminUsers.onBeforeInstall"),
        onInstall: createTopic("adminUsers.onInstall"),
        onAfterInstall: createTopic("adminUsers.onAfterInstall"),
        onCleanup: createTopic("adminUsers.onCleanup"),
        getStorageOperations() {
            return storageOperations;
        },
        async isEmailTaken(email) {
            const exists = await storageOperations.getUser({
                where: { tenant: getTenant(), email }
            });

            if (exists) {
                throw new WebinyError({
                    message: "User with that email already exists.",
                    code: "USER_EXISTS",
                    data: { email }
                });
            }
        },
        /**
         * TODO @ts-refactor figure out better way to type this
         */
        // @ts-ignore
        async createUser(this: AdminUsers, data) {
            await checkPermission();
            const tenant = getTenant();

            await this.isEmailTaken(data.email);

            const identity = getIdentity();

            let createdBy: CreatedBy | null = null;
            if (identity) {
                createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };
            }

            const user: AdminUser = {
                ...data,
                id: data.id || mdbid(),
                createdOn: new Date().toISOString(),
                createdBy,
                tenant,
                webinyVersion: process.env.WEBINY_VERSION as string
            };

            let result;

            // Notify WCP about the created user.
            await incrementWcpSeats();

            try {
                await this.onUserBeforeCreate.publish({ user, inputData: data });
                /**
                 * Always delete `password` from the user data!
                 */
                delete (user as any)["password"];
                try {
                    result = await storageOperations.createUser({ user });
                } catch (err) {
                    throw WebinyError.from(err, {
                        message: "Could not create user.",
                        code: "CREATE_USER_ERROR",
                        data: { user: result || user }
                    });
                }
                try {
                    await this.onUserAfterCreate.publish({ user: result, inputData: data });
                } catch (err) {
                    console.log("@webiny/api-admin-users-cognito/src/createAdminUsers.ts");
                    // Not sure if we care about errors in `onAfterCreate`.
                    // Maybe add an `onCreateError` event for potential cleanup operations?
                    // For now, just log it.
                    console.log(err);
                }

                loaders.getUser.clear(result.id).prime(result.id, result);
            } catch (e) {
                // If something failed, let's undo the previous incrementWcpSeats call.
                await decrementWcpSeats();
                throw e;
            }

            return result;
        },
        async deleteUser(this: AdminUsers, id: string) {
            await checkPermission();

            const identity = getIdentity();
            const user = await this.getUser({ where: { id } });

            if (!user) {
                throw new NotFoundError(`User "${id}" was not found!`);
            }

            if (user.id === identity.id) {
                throw new WebinyError(`You can't delete your own user account.`);
            }

            try {
                await this.onUserBeforeDelete.publish({ user });
                await storageOperations.deleteUser({ user });
                loaders.clearLoadersCache([{ tenant: getTenant(), id }]);

                // Notify WCP about the deleted user.
                await decrementWcpSeats();

                await this.onUserAfterDelete.publish({ user });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete user.",
                    code: "DELETE_USER_ERROR",
                    data: { user }
                });
            }
        },
        async getUser({ where }) {
            await checkPermission();

            // Majority of querying is happening via `id`, so let's use a DataLoader here.
            if (where.id) {
                return await loaders.getUser.load({
                    ...where,
                    tenant: where.tenant || getTenant()
                });
            }

            // Querying by email is very rare, so we don't need to bother with DataLoader for now.
            const tenant = getTenant();
            return storageOperations.getUser({ where: { tenant, ...where } });
        },
        async listUsers(params = {}) {
            await checkPermission();

            try {
                return storageOperations.listUsers({
                    where: { tenant: getTenant(), ...params.where },
                    sort: params.sort || ["createdOn_ASC"]
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Cannot list users.",
                    code: "LIST_USERS_ERROR",
                    data: { tenant: getTenant(), ...params }
                });
            }
        },
        /**
         * TODO @ts-refactor figure out better way to type this
         */
        // @ts-ignore
        async updateUser(this: AdminUsers, id, data) {
            await checkPermission();

            const originalUser = await this.getUser({ where: { id } });
            if (!originalUser) {
                throw new NotFoundError(`User "${id}" was not found!`);
            }

            const updateData = cloneDeep(data);

            try {
                await this.onUserBeforeUpdate.publish({
                    user: originalUser,
                    updateData,
                    inputData: data
                });

                const updatedUser = { ...originalUser, ...updateData };

                await storageOperations.updateUser({ user: updatedUser });

                await this.onUserAfterUpdate.publish({
                    originalUser,
                    updatedUser,
                    inputData: data
                });

                await loaders.updateDataLoaderUserCache({ tenant: getTenant(), id }, updateData);

                return updatedUser;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Cannot update user.",
                    code: "UPDATE_USER_ERROR"
                });
            }
        },
        async getVersion() {
            const tenantId = getTenant();
            if (!tenantId) {
                return null;
            }

            const system = await storageOperations.getSystemData({ tenant: tenantId });

            return system ? system.version || null : null;
        },

        async setVersion(version) {
            const original = await storageOperations.getSystemData({ tenant: getTenant() });

            const system: System = { tenant: getTenant(), version };

            if (original) {
                try {
                    return await storageOperations.updateSystemData({
                        system: { ...original, version }
                    });
                } catch (err) {
                    throw WebinyError.from(err, {
                        message: "Could not update existing system data.",
                        code: "UPDATE_SYSTEM_ERROR",
                        data: { original, system }
                    });
                }
            }
            try {
                return await storageOperations.createSystemData({ system });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create the system data.",
                    code: "CREATE_SYSTEM_ERROR",
                    data: { system }
                });
            }
        },

        async install(this: AdminUsers, data) {
            if (await this.getVersion()) {
                throw new WebinyError(
                    "Admin Users is already installed.",
                    "ADMIN_USERS_INSTALL_ABORTED"
                );
            }

            const user = { ...data, id: mdbid() };
            const installEvent = { tenant: getTenant(), user };

            try {
                await this.onBeforeInstall.publish(installEvent);
                await this.onInstall.publish(installEvent);
                await this.onAfterInstall.publish(installEvent);
            } catch (err) {
                await this.onCleanup.publish({ error: err, tenant: getTenant(), user });

                throw WebinyError.from(err, { message: "ADMIN_USERS_INSTALL_ABORTED" });
            }

            // Store app version
            await this.setVersion(process.env.WEBINY_VERSION as string);
        }
    };

    attachUserValidation(adminUsers);

    return adminUsers;
};
