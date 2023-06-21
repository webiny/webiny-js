import { SecurityPermission, SecurityIdentity, CreatedBy } from "~/types";
import NotAuthorizedError from "~/NotAuthorizedError";

const FULL_ACCESS_PERMISSION_NAME = "*";

type Check = Partial<{
    rwd: string;
    pw: string;
    owns: CreatedBy;
}>;

export interface PermissionsCheckerParams<
    TPermission extends SecurityPermission = SecurityPermission
> {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => TPermission[] | Promise<TPermission[]>;
    fullAccessPermissionName?: string;
}

export class AppPermissions<TPermission extends SecurityPermission = SecurityPermission> {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => TPermission[] | Promise<TPermission[]>;
    private fullAccessPermissions: string[];

    constructor({
        getIdentity,
        getPermissions,
        fullAccessPermissionName
    }: PermissionsCheckerParams<TPermission>) {
        this.getIdentity = getIdentity;
        this.getPermissions = getPermissions;
        this.fullAccessPermissions = [
            FULL_ACCESS_PERMISSION_NAME,
            fullAccessPermissionName || ""
        ].filter(Boolean);
    }

    async ensure(check: Check = {}) {
        if (await this.hasFullAccess()) {
            return;
        }

        if (check.owns) {
            if (await this.canAccessNonOwnedRecords()) {
                return;
            }

            // If we got here, that means we didn't encounter a permission object
            // that gives us the ability to access non-owned records.
            const identity = await this.getIdentity();
            if (identity.id === check.owns.id) {
                return;
            }

            throw new NotAuthorizedError();
        }

        const permissions = await this.getPermissions();
        const hasPermission = permissions.some(current => {
            if (check.rwd && !this.hasRwd(current, check.rwd)) {
                return false;
            }

            if (check.pw && !this.hasPw(current, check.pw)) {
                return false;
            }

            return true;
        });

        if (!hasPermission) {
            throw new NotAuthorizedError();
        }
    }

    async hasFullAccess() {
        const permissions = await this.getPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }

    async canAccessNonOwnedRecords() {
        // First pass - check if we have full access.
        if (await this.hasFullAccess()) {
            return true;
        }

        // Second pass - if there's at least one permission that doesn't
        // prevent us from accessing non-owned records, then we grant access.
        const permissions = await this.getPermissions();
        return permissions.some(p => !p.own);
    }

    async canAccessOnlyOwnRecords() {
        // First pass - check if we have full access to Page Builder.
        if (await this.hasFullAccess()) {
            return false;
        }

        // Second pass - if there's at least one permission that doesn't
        // prevent us from accessing non-owned records, then we grant access.
        const permissions = await this.getPermissions();
        return !permissions.some(p => !p.own);
    }

    private hasRwd(permission: TPermission, rwd: string) {
        return typeof permission.rwd !== "string" || permission.rwd.includes(rwd);
    }

    // Has publishing workflow permissions?
    private hasPw(permission: TPermission, pw: string) {
        const isCustom = Object.keys(permission).length > 1; // "name" key is always present

        if (!isCustom) {
            // Means it's a "full-access" permission.
            return true;
        }

        if (typeof permission["pw"] !== "string") {
            return false;
        }

        return permission["pw"].includes(pw);
    }
}
