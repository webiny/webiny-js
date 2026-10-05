import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { AuditLogPermissions as Abstraction } from "./abstractions.js";

/**
 * Full access ("*"), access to all audit logs ("al.*"), or access to the action ("al.<action>").
 */
class AuditLogPermissionsImpl implements Abstraction.Interface {
    public constructor(private readonly identityContext: IdentityContext.Interface) {}

    public async canAccessAll(): Promise<boolean> {
        const permissions = await this.identityContext.getPermissions("al.*");

        return permissions.some(permission => {
            return permission.name === "*" || permission.name === "al.*";
        });
    }

    public async canAccess(action: string): Promise<boolean> {
        const permissions = await this.identityContext.getPermissions("al.*");

        return permissions.some(permission => {
            return (
                permission.name === "*" ||
                permission.name === "al.*" ||
                permission.name === `al.${action}`
            );
        });
    }
}

export const AuditLogPermissions = Abstraction.createImplementation({
    implementation: AuditLogPermissionsImpl,
    dependencies: [IdentityContext]
});
