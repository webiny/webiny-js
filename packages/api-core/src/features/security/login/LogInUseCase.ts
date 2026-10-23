import { Result } from "@webiny/feature/api";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetIdentityProfileUseCase } from "~/features/users/GetIdentityProfile/index.js";
import { UserNotFoundError, UserStorageError } from "~/features/users/shared/errors.js";
import { ResolveIdentityTenantsUseCase } from "~/features/security/ResolveIdentityTenants/abstractions.js";
import { AfterLoginEvent, LogInUseCase as UseCaseAbstraction } from "./abstractions.js";
import {
    LogInMissingProfileError,
    LogInNotAuthenticatedError,
    LogInTenantAccessDeniedError
} from "./errors.js";

class LogInUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getIdentityProfile: GetIdentityProfileUseCase.Interface,
        private resolveIdentityTenants: ResolveIdentityTenantsUseCase.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new LogInNotAuthenticatedError());
        }

        /**
         * External identities are provisioned by the AfterLogin handlers, so the profile is
         * loaded after them. Native identities must have a profile before AfterLogin runs:
         * without one, they get the list of their tenants instead.
         */
        const isExternal = identity.profile.external;

        if (isExternal) {
            // The IdP decides tenant access for its identities. Without access, AfterLogin must
            // not run, or the user sync would create a record in a tenant they can't use.
            if (identity.context.canAccessTenant === false) {
                return Result.fail(new LogInTenantAccessDeniedError());
            }

            await this.eventPublisher.publish(new AfterLoginEvent({ identity }));
        }

        const profileResult = await this.identityContext.withoutAuthorization(async () => {
            return this.getIdentityProfile.execute(identity.id);
        });

        if (profileResult.isFail()) {
            if (!isExternal) {
                // A failed read says nothing about where the user belongs, so it fails the login.
                if (profileResult.error instanceof UserStorageError) {
                    return Result.fail(profileResult.error);
                }

                if (profileResult.error instanceof UserNotFoundError) {
                    const tenantsResult = await this.listIdentityTenants(identity.id);
                    if (tenantsResult.isFail()) {
                        return Result.fail(tenantsResult.error);
                    }

                    const tenants = tenantsResult.value;
                    if (tenants.length > 0) {
                        return Result.ok({ type: "tenantSelectionRequired", tenants });
                    }
                }
            }

            return Result.fail(new LogInMissingProfileError());
        }

        if (!isExternal) {
            await this.eventPublisher.publish(new AfterLoginEvent({ identity }));
        }

        return Result.ok({ type: "loggedIn", identity, user: profileResult.value });
    }

    private async listIdentityTenants(
        identityId: string
    ): Promise<Result<ResolveIdentityTenantsUseCase.Tenant[], UserStorageError>> {
        const result = await this.identityContext.withoutAuthorization(async () => {
            return this.resolveIdentityTenants.execute(identityId);
        });

        if (result.isFail()) {
            // Like the profile read, a failed lookup fails the login instead of saying "no access".
            if (result.error instanceof UserStorageError) {
                return Result.fail(result.error);
            }
            return Result.ok([]);
        }

        // The profile lookup already covered the current tenant, so offering it would loop.
        const currentTenantId = this.tenantContext.getTenant().id;
        return Result.ok(result.value.filter(tenant => tenant.id !== currentTenantId));
    }
}

export const LogInUseCase = UseCaseAbstraction.createImplementation({
    implementation: LogInUseCaseImpl,
    dependencies: [
        IdentityContext,
        TenantContext,
        EventPublisher,
        GetIdentityProfileUseCase,
        ResolveIdentityTenantsUseCase
    ]
});
