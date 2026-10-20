import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { GetUserInput } from "@webiny/api-core/features/users/shared/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";
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

// A new fake rather than an extension of `FakeAdminUsers.ts`: that one has no names, no permission
// check and no authorization recording, and `CandidateReadAccess.test.ts` relies on its shape.
export type FakeNamedUsersMode = "stored" | "throwing" | "failing";

export interface UserLookupCall {
    userId: string;
    authorizationEnabled: boolean;
}

/** Every `GetUserUseCase.execute` call, with the authorization state it ran in. Clear it per test. */
export const userLookups: UserLookupCall[] = [];

class FakeNamedUsers implements GetUserUseCase.Interface {
    public constructor(
        private getIdentityContext: () => IdentityContext.Interface,
        private mode: FakeNamedUsersMode
    ) {}

    public async execute(input: GetUserInput): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        const identityContext = this.getIdentityContext();
        const id = input.id ?? "";
        userLookups.push({
            userId: id,
            authorizationEnabled: identityContext.isAuthorizationEnabled()
        });

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
        const displayName = USER_NAMES[id];
        if (!displayName) {
            return Result.fail(new UserNotFoundError(id));
        }
        return Result.ok({
            id,
            displayName,
            email: `${id}@webiny.test`,
            tenant: "root",
            createdOn: "2026-10-01T00:00:00.000Z",
            createdBy: null
        });
    }
}

/** Replaces `GetUserUseCase` of the request container. Call it in the test's `setup`. */
export const registerFakeNamedUsers = (
    container: Container,
    mode: FakeNamedUsersMode = "stored"
) => {
    container.registerInstance(
        GetUserUseCase,
        new FakeNamedUsers(() => container.resolve(IdentityContext), mode)
    );
};
