import { UserAfterDeleteHandler } from "@webiny/api-core/features/DeleteUser";
import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { DeleteTenantLinks } from "@webiny/api-core/features/DeleteTenantLinks";

class UserAfterDeleteHandlerImpl implements UserAfterDeleteHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private deleteTenantLinks: DeleteTenantLinks.Interface
    ) {}

    async handle(event: UserAfterDeleteHandler.Event): Promise<void> {
        const { user } = event.payload;

        if (user.external) {
            return;
        }

        const tenant = this.tenantContext.getTenant();

        const deleteResult = await this.deleteTenantLinks.execute([
            {
                tenant: tenant.id,
                identity: user.id
            }
        ]);

        if (deleteResult.isFail()) {
            throw new Error(`Failed to delete tenant links: ${deleteResult.error.message}`);
        }
    }
}

export const CognitoUserAfterDeleteHandler = createImplementation({
    abstraction: UserAfterDeleteHandler,
    implementation: UserAfterDeleteHandlerImpl,
    dependencies: [TenantContext, DeleteTenantLinks]
});
