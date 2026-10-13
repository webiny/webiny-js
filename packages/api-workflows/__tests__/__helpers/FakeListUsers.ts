import { Result } from "@webiny/feature/api";
import type { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";

export interface FakeUser {
    id: string;
    displayName: string;
    teams: string[];
}

export interface ListUsersCall {
    input: ListUsersInput;
    /** Whether authorization was on during the call; `null` before `watch`. */
    authorizationEnabled: boolean | null;
}

/**
 * Admin users from a fixed list, filtered by `id_in` and `teams_in` like api-core does. Records
 * every call and fails the next `failuresLeft` calls with a storage error. Register with
 * `container.registerInstance(ListUsersUseCase, fake)` and call `watch` once the context exists.
 */
export class FakeListUsers implements ListUsersUseCase.Interface {
    public readonly calls: ListUsersCall[] = [];
    public failuresLeft = 0;
    private identityContext: IdentityContext.Interface | null = null;

    public constructor(private users: FakeUser[]) {}

    public watch(identityContext: IdentityContext.Interface): void {
        this.identityContext = identityContext;
    }

    public async execute(
        input: ListUsersInput = {}
    ): Promise<Result<AdminUser[], ListUsersUseCase.Error>> {
        this.calls.push({
            input: structuredClone(input),
            authorizationEnabled: this.identityContext
                ? this.identityContext.isAuthorizationEnabled()
                : null
        });
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        const where = input.where ?? {};
        const users = this.users.filter(user => {
            const idMatches = !where.id_in || where.id_in.includes(user.id);
            const teamMatches =
                !where.teams_in || where.teams_in.some(teamId => user.teams.includes(teamId));
            return idMatches && teamMatches;
        });
        return Result.ok(
            users.map(user => ({
                id: user.id,
                displayName: user.displayName,
                email: `${user.id}@webiny.test`,
                teams: [...user.teams],
                tenant: "root",
                createdOn: "2026-10-01T00:00:00.000Z",
                createdBy: null
            }))
        );
    }
}
