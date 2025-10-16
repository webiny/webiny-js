import type { ListAdminUsersGateway } from "../abstractions.js";
import type { AdminUser, AdminUsers } from "@webiny/api-admin-users/types.js";
import type { Security } from "@webiny/api-security/types.js";

export class ListAdminUsersGatewayFromContext implements ListAdminUsersGateway.Interface {
    constructor(
        private security: Security,
        private adminUsers: AdminUsers
    ) {}

    public async execute(): Promise<AdminUser[]> {
        return this.security.withoutAuthorization(async () => {
            return this.adminUsers.listUsers();
        });
    }
}
