import { Result } from "@webiny/feature/api";
import type { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";

export interface FakeUser {
    id: string;
    displayName: string;
    teams: string[];
    /** The tenant the user belongs to; `ROOT_TENANT_ID` when omitted. */
    tenant?: string;
}

/** The tenant of a `FakeUser` without one, and the tenant looked in before `watch` gets a tenant context. */
const ROOT_TENANT_ID = "root";

export interface ListUsersCall {
    input: ListUsersInput;
    /** Whether authorization was on during the call; `null` before `watch`. */
    authorizationEnabled: boolean | null;
    /**
     * The current tenant during the call; left out until `watch` gets a tenant context (the call
     * then looks in `ROOT_TENANT_ID`).
     */
    tenant?: string;
}

/**
 * Admin users from a fixed list, filtered by the current tenant, `id_in` and `teams_in` like
 * api-core does (a tenant context passed to `watch` names the tenant, `ROOT_TENANT_ID` without one). Records
 * every call, fails the next `failuresLeft` calls with a storage error and throws `throwMessage` on
 * the next `throwsLeft` calls. Register with
 * `container.registerInstance(ListUsersUseCase, fake)` and call `watch` once the context exists.
 */
export class FakeListUsers implements ListUsersUseCase.Interface {
    public readonly calls: ListUsersCall[] = [];
    public failuresLeft = 0;
    public throwsLeft = 0;
    public throwMessage = "Users are down.";
    private identityContext: IdentityContext.Interface | null = null;
    private tenantContext: TenantContext.Interface | null = null;

    public constructor(private users: FakeUser[]) {}

    public watch(
        identityContext: IdentityContext.Interface,
        tenantContext?: TenantContext.Interface
    ): void {
        this.identityContext = identityContext;
        this.tenantContext = tenantContext ?? null;
    }

    public async execute(
        input: ListUsersInput = {}
    ): Promise<Result<AdminUser[], ListUsersUseCase.Error>> {
        const currentTenant = this.tenantContext?.getTenant().id;
        const tenant = currentTenant ?? ROOT_TENANT_ID;
        this.calls.push({
            input: structuredClone(input),
            authorizationEnabled: this.identityContext
                ? this.identityContext.isAuthorizationEnabled()
                : null,
            ...(currentTenant === undefined ? {} : { tenant: currentTenant })
        });
        if (this.throwsLeft > 0) {
            this.throwsLeft -= 1;
            throw new Error(this.throwMessage);
        }
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        const where = input.where ?? {};
        const users = this.users.filter(user => {
            const tenantMatches = (user.tenant ?? ROOT_TENANT_ID) === tenant;
            const idMatches = !where.id_in || where.id_in.includes(user.id);
            const teamMatches =
                !where.teams_in || where.teams_in.some(teamId => user.teams.includes(teamId));
            return tenantMatches && idMatches && teamMatches;
        });
        return Result.ok(
            users.map(user => ({
                id: user.id,
                displayName: user.displayName,
                email: `${user.id}@webiny.test`,
                teams: [...user.teams],
                tenant: user.tenant ?? ROOT_TENANT_ID,
                createdOn: "2026-10-01T00:00:00.000Z",
                createdBy: null
            }))
        );
    }
}
