import type { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateUserUseCase } from "@webiny/api-core/features/users/CreateUser/index.js";
import { UpdateUserUseCase } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { DeleteUserUseCase } from "@webiny/api-core/features/users/DeleteUser/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { EmailTakenError } from "@webiny/api-core/features/users/shared/errors.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";

export interface InMemoryAdminUsersOptions {
    /** Whether the caller holds `adminUsers.user`. Defaults to yes. */
    canManageUsers?: boolean;
    /** The id of whoever is calling. */
    identityId?: string;
}

/**
 * api-core's user use cases, in memory, for one tenant, plus an identity to call them as. Holds the
 * same rules the real ones do where the self-hosted use cases depend on them: the permission check,
 * the per-tenant address check, and refusing to delete your own account.
 */
export const createInMemoryAdminUsers = (
    seed: AdminUser[] = [],
    options: InMemoryAdminUsersOptions = {}
) => {
    const rows: AdminUser[] = seed.map(user => ({ ...user }));
    const canManageUsers = options.canManageUsers ?? true;
    const identityId = options.identityId ?? "caller";

    let nextId = 1;

    const allowed = () => canManageUsers;

    const identityContext = {
        getIdentity: () => ({ id: identityId, type: "admin", displayName: "Caller" }),
        getPermission: async () => (allowed() ? { name: "adminUsers.user" } : null)
    } as unknown as IdentityContext.Interface;

    const createUser: CreateUserUseCase.Interface = {
        async execute(input) {
            if (!allowed()) {
                return Result.fail(new NotAuthorizedError());
            }
            if (rows.some(row => row.email === input.email)) {
                return Result.fail(new EmailTakenError(input.email));
            }

            const user = {
                ...input,
                id: input.id ?? `user-${nextId++}`,
                displayName: input.displayName ?? input.email
            } as unknown as AdminUser;
            rows.push(user);

            return Result.ok(user);
        }
    };

    const updateUser: UpdateUserUseCase.Interface = {
        async execute(id, input) {
            if (!allowed()) {
                return Result.fail(new NotAuthorizedError());
            }
            const index = rows.findIndex(row => row.id === id);
            if (index === -1) {
                return Result.fail(new UserNotFoundError(id));
            }
            if (input.email && rows.some(row => row.id !== id && row.email === input.email)) {
                return Result.fail(new EmailTakenError(input.email));
            }

            // api-core's update validation has no `email`, so the address never changes here either.
            const { email: _email, ...changes } = input;
            rows[index] = { ...rows[index]!, ...changes } as AdminUser;

            return Result.ok(rows[index]!);
        }
    };

    const deleteUser: DeleteUserUseCase.Interface = {
        async execute(id) {
            if (!allowed()) {
                return Result.fail(new NotAuthorizedError());
            }
            const index = rows.findIndex(row => row.id === id);
            if (index === -1) {
                return Result.fail(new UserNotFoundError(id));
            }

            rows.splice(index, 1);

            return Result.ok();
        }
    };

    const getUser: GetUserUseCase.Interface = {
        async execute(input) {
            const user = rows.find(row => row.id === input.id);

            return user ? Result.ok(user) : Result.fail(new UserNotFoundError(input.id!));
        }
    };

    return {
        rows,
        register(container: Container) {
            container.registerInstance(IdentityContext, identityContext);
            container.registerInstance(CreateUserUseCase, createUser);
            container.registerInstance(UpdateUserUseCase, updateUser);
            container.registerInstance(DeleteUserUseCase, deleteUser);
            container.registerInstance(GetUserUseCase, getUser);
        }
    };
};
