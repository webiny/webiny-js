import { SecurityPermission, SecurityIdentity, CreatedBy } from "~/types";
import NotAuthorizedError from "~/NotAuthorizedError";

const FULL_ACCESS_PERMISSION_NAME = "*";

export interface AppPermissionsParams<TPermission extends SecurityPermission = SecurityPermission> {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => TPermission[] | Promise<TPermission[]>;
    fullAccessPermissionName?: string;
}

export type EnsureParams = Partial<{
    rwd: string;
    pw: string;
    owns: CreatedBy;
}>;

export type Options = Partial<{
    throw: boolean;
}>;

export class AppPermissions<TPermission extends SecurityPermission = SecurityPermission> {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => TPermission[] | Promise<TPermission[]>;
    private fullAccessPermissions: string[];

    constructor({
        getIdentity,
        getPermissions,
        fullAccessPermissionName
    }: AppPermissionsParams<TPermission>) {
        this.getIdentity = getIdentity;
        this.getPermissions = getPermissions;
        this.fullAccessPermissions = [
            FULL_ACCESS_PERMISSION_NAME,
            fullAccessPermissionName || ""
        ].filter(Boolean);
    }

    async ensure(params: EnsureParams = {}, options: Options = {}): Promise<boolean> {
        if (await this.hasFullAccess()) {
            return true;
        }

        if (params.owns) {
            if (await this.canAccessNonOwnedRecords()) {
                return true;
            }

            // If we got here, that means we didn't encounter a permission object
            // that gives us the ability to access non-owned records.
            const identity = await this.getIdentity();
            if (identity.id === params.owns.id) {
                return true;
            }

            if (options.throw !== false) {
                throw new NotAuthorizedError();
            }

            return false;
        }

        const permissions = await this.getPermissions();
        const hasPermission = permissions.some(current => {
            if (params.rwd && !this.hasRwd(current, params.rwd)) {
                return false;
            }

            if (params.pw && !this.hasPw(current, params.pw)) {
                return false;
            }

            return true;
        });

        if (hasPermission) {
            return true;
        }

        if (options.throw === false) {
            return false;
        }

        throw new NotAuthorizedError();
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
        // `name` and `_src` properties are always present.
        const permissionWithoutSystemProperties =
            this.filterOutSystemPermissionsObjectProperties(permission);

        const isCustom = Object.keys(permissionWithoutSystemProperties).length > 0;

        if (!isCustom) {
            // Means it's a "full-access" permission.
            return true;
        }

        if (typeof permission["pw"] !== "string") {
            return false;
        }

        return permission["pw"].includes(pw);
    }

    /**
     * Filters out base `name` and `_src` properties from the permission object.
     */
    private filterOutSystemPermissionsObjectProperties(permission: SecurityPermission) {
        return Object.keys(permission).reduce(
            (acc, key) => {
                if (key !== "name" && key !== "_src") {
                    acc[key] = permission[key];
                }
                return acc;
            },
            {} as Record<string, any>
        );
    }
}
