import { createTopic } from "@webiny/pubsub";
import WebinyError from "@webiny/error";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { mdbid } from "@webiny/utils";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    AdminUser,
    AdminUsers,
    AdminUsersStorageOperations,
    CreatedBy,
    CreateUserInput,
    System
} from "./types";
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

    const getDisplayName = (data: CreateUserInput) => {
        // If display name is not set, try to get it from the first name and last name.
        // If first name and last name are not set, use the e-mail address.
        if (data.displayName) {
            return data.displayName;
        }

        if (data.firstName || data.lastName) {
            return `${data.firstName || ""} ${data.lastName || ""}`.trim();
        }

        if (data.email) {
            return data.email;
        }

        return "Missing display name";
    };

    const onUserAfterCreate = createTopic("adminUsers.onCreateAfter");
    const onUserAfterDelete = createTopic("adminUsers.onDeleteAfter");
    const onUserAfterUpdate = createTopic("adminUsers.onUpdateAfter");
    const onUserBeforeCreate = createTopic("adminUsers.onCreateBefore");
    const onUserBeforeDelete = createTopic("adminUsers.onDeleteBefore");
    const onUserBeforeUpdate = createTopic("adminUsers.onUpdateBefore");
    const onUserCreateError = createTopic("adminUsers.onCreateError");
    const onUserUpdateError = createTopic("adminUsers.onUpdateError");
    const onUserDeleteError = createTopic("adminUsers.onDeleteError");
    const onBeforeInstall = createTopic("adminUsers.onSystemBeforeInstall");
    const onSystemBeforeInstall = createTopic("adminUsers.onSystemBeforeInstall");
    const onInstall = createTopic("adminUsers.onSystemInstall");
    const onAfterInstall = createTopic("adminUsers.onSystemAfterInstall");
    const onSystemAfterInstall = createTopic("adminUsers.onSystemAfterInstall");
    const onCleanup = createTopic("adminUsers.onCleanup");

    attachUserValidation({
        onUserBeforeCreate,
        onUserBeforeUpdate
    });

    return {
        onUserAfterCreate,
        onUserAfterDelete,
        onUserAfterUpdate,
        onUserBeforeCreate,
        onUserBeforeDelete,
        onUserBeforeUpdate,
        onUserCreateError,
        onUserUpdateError,
        onUserDeleteError,
        onBeforeInstall,
        onSystemBeforeInstall,
        onInstall,
        onAfterInstall,
        onSystemAfterInstall,
        onCleanup,
        getStorageOperations() {
            return storageOperations;
        },

        // Note that, by default, e-mail is only stored when the default Cognito setup is being used.
        // With other IdPs, e.g. Okta, the e-mail field contains the ID of the user in the IdP.
        // For example: packages/api-security-okta/src/createAdminUsersHooks.ts:13
        // In the future, we might want to rename the `email` field to `idpId` or something similar.
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
        // @ts-expect-error
        async createUser(this: AdminUsers, data) {
            await checkPermission();

            const tenant = getTenant();
            const identity = getIdentity();

            let createdBy: CreatedBy | null = null;
            if (identity) {
                createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };
            }

            const id = data.id || mdbid();
            const email = data.email;
            const createdOn = new Date().toISOString();
            const displayName = getDisplayName(data);
            const webinyVersion = process.env.WEBINY_VERSION as string;

            // Before proceeding, ensure that the e-mail is not already taken.
            await this.isEmailTaken(email);

            const user: AdminUser = {
                ...data,
                id,
                email,
                displayName,
                createdOn,
                createdBy,
                tenant,
                webinyVersion
            };

            let result;

            // Notify WCP about the created user.
            await incrementWcpSeats();

            try {
                await onUserBeforeCreate.publish({ user, inputData: data });
                /**
                 * Always delete `password` from the user data!
                 *
                 * Error is expected because password is not optional parameter.
                 */
                // @ts-expect-error
                delete user["password"];

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
                    await onUserAfterCreate.publish({ user: result, inputData: data });
                } catch (err) {
                    console.log("@webiny/api-admin-users/src/createAdminUsers.ts");
                    // Not sure if we care about errors in `onAfterCreate`.
                    // Maybe add an `onCreateError` event for potential cleanup operations?
                    // For now, just log it.
                    console.log(err);
                }

                loaders.getUser.clear(result.id).prime(result.id, result);
            } catch (e) {
                if (e.code === "CREATE_USER_ERROR") {
                    // User not created? Undo the previous seats increment.
                    await decrementWcpSeats();
                }

                await onUserCreateError.publish({
                    user,
                    inputData: data,
                    error: e
                });

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
                await onUserBeforeDelete.publish({ user });
                await storageOperations.deleteUser({ user });
                loaders.clearLoadersCache([{ tenant: getTenant(), id }]);

                // Notify WCP about the deleted user.
                await decrementWcpSeats();

                await onUserAfterDelete.publish({ user });
            } catch (err) {
                await onUserDeleteError.publish({
                    user,
                    error: err
                });
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
                return loaders.getUser.load({
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
        // @ts-expect-error
        async updateUser(this: AdminUsers, id, data) {
            await checkPermission();

            const originalUser = await this.getUser({ where: { id } });
            if (!originalUser) {
                throw new NotFoundError(`User "${id}" was not found!`);
            }

            const updateData = structuredClone(data);

            try {
                await onUserBeforeUpdate.publish({
                    user: originalUser,
                    updateData,
                    inputData: data
                });

                const updatedUser = { ...originalUser, ...updateData };

                await storageOperations.updateUser({ user: updatedUser });

                await onUserAfterUpdate.publish({
                    originalUser,
                    updatedUser,
                    inputData: data
                });

                await loaders.updateDataLoaderUserCache({ tenant: getTenant(), id }, updateData);

                return updatedUser;
            } catch (err) {
                await onUserUpdateError.publish({
                    user: originalUser,
                    inputData: data,
                    error: err
                });
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
                await onSystemBeforeInstall.publish(installEvent);
                await onInstall.publish(installEvent);
                await onSystemAfterInstall.publish(installEvent);
            } catch (err) {
                await onCleanup.publish({ error: err, tenant: getTenant(), user });

                throw WebinyError.from(err, { message: "ADMIN_USERS_INSTALL_ABORTED" });
            }

            // Store app version
            await this.setVersion(process.env.WEBINY_VERSION as string);
        }
    };
};
