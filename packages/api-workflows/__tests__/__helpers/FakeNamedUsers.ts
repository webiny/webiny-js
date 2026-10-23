import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";

export const KNOWN_USER_ID = "user-maja";
export const KNOWN_USER_NAME = "Maja Kos";
export const OTHER_KNOWN_USER_ID = "user-rita";
export const OTHER_KNOWN_USER_NAME = "Rita Requester";

const USER_NAMES: Record<string, string> = {
    [KNOWN_USER_ID]: KNOWN_USER_NAME,
    [OTHER_KNOWN_USER_ID]: OTHER_KNOWN_USER_NAME
};

export type FakeNamedUsersMode = "stored" | "throwing" | "failing";

export interface UserLookupCall {
    ids: string[];
    authorizationEnabled: boolean;
}

/** Every `ListUsersUseCase.execute` call, with the authorization state it ran in. Clear it per test. */
export const userLookups: UserLookupCall[] = [];

class FakeNamedUsers implements ListUsersUseCase.Interface {
    public constructor(
        private getIdentityContext: () => IdentityContext.Interface,
        private mode: FakeNamedUsersMode
    ) {}

    public async execute(
        input?: ListUsersInput
    ): Promise<Result<AdminUser[], ListUsersUseCase.Error>> {
        const identityContext = this.getIdentityContext();
        const ids = input?.where?.id_in ?? [];
        userLookups.push({ ids, authorizationEnabled: identityContext.isAuthorizationEnabled() });

        if (this.mode === "throwing") {
            throw new Error("Users are down.");
        }
        if (this.mode === "failing") {
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        // As the real use case: the caller needs the users permission.
        const permission = await identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }
        return Result.ok(
            ids
                .filter(id => USER_NAMES[id])
                .map(id => ({
                    id,
                    displayName: USER_NAMES[id],
                    email: `${id}@webiny.test`,
                    tenant: "root",
                    createdOn: "2026-10-01T00:00:00.000Z",
                    createdBy: null
                }))
        );
    }
}

/** Replaces `ListUsersUseCase` of the request container. Call it in the test's `setup`. */
export const registerFakeNamedUsers = (
    container: Container,
    mode: FakeNamedUsersMode = "stored"
) => {
    container.registerInstance(
        ListUsersUseCase,
        new FakeNamedUsers(() => container.resolve(IdentityContext), mode)
    );
};
