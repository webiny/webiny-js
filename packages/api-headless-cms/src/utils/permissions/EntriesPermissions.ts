import { CmsEntryPermission, CmsModel } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { CreatedBy, SecurityIdentity } from "@webiny/api-security/types";
import { ModelsPermissions } from "~/utils/permissions/ModelsPermissions";

interface EnsureParams {
    model: CmsModel;
    rwd?: string;
    pw?: string;
    owns?: CreatedBy;
}

interface HasFullAccessParams {
    model: CmsModel;
}

interface CanAccessNonOwnedRecordsParams {
    model: CmsModel;
}

export interface EntriesPermissionsParams {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => CmsEntryPermission[] | Promise<CmsEntryPermission[]>;
    modelsPermissions: ModelsPermissions;
}

export interface CanAccessOnlyOwnRecordsParams {
    model: CmsModel;
}

export class EntriesPermissions {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => CmsEntryPermission[] | Promise<CmsEntryPermission[]>;
    private fullAccessPermissions: string[];
    private modelsPermissions: ModelsPermissions;

    constructor({ getIdentity, getPermissions, modelsPermissions }: EntriesPermissionsParams) {
        this.getIdentity = getIdentity;
        this.getPermissions = getPermissions;
        this.fullAccessPermissions = ["*", "cms.*"];
        this.modelsPermissions = modelsPermissions;
    }

    async canAccess(params: EnsureParams): Promise<boolean> {
        const hasFullAccess = await this.hasFullAccess(params);
        if (hasFullAccess) {
            return true;
        }

        const canReadModel = await this.canReadModel(params.model);
        if (!canReadModel) {
            return false;
        }

        if (params.owns) {
            if (await this.canAccessNonOwnedRecords(params)) {
                return true;
            }

            // If we got here, that means we didn't encounter a permission object
            // that gives us the ability to access non-owned records.
            const identity = await this.getIdentity();
            if (identity.id === params.owns.id) {
                return true;
            }

            return false;
        }

        const permissions = await this.getPermissions();
        const hasPermission = permissions.some(current => {
            if (params.rwd) {
                return this.hasRwd(current, params.rwd);
            }

            if (params.pw) {
                return this.hasPw(current, params.pw);
            }

            return true;
        });

        if (hasPermission) {
            return true;
        }

        return false;
    }

    async ensureCanAccess(params: EnsureParams) {
        const canAccess = await this.canAccess(params);
        if (!canAccess) {
            throw new NotAuthorizedError();
        }
    }

    async canAccessNonOwnedRecords(params: CanAccessNonOwnedRecordsParams) {
        const hasFullAccess = await this.hasFullAccess(params);
        if (hasFullAccess) {
            return true;
        }

        const permissions = await this.getPermissions();
        return permissions.some(p => !p.own);
    }

    async canAccessOnlyOwnRecords(params: CanAccessOnlyOwnRecordsParams) {
        const hasFullAccess = await this.hasFullAccess(params);
        if (hasFullAccess) {
            return false;
        }

        const canAccessNonOwnedRecords = await this.canAccessNonOwnedRecords(params);
        return !canAccessNonOwnedRecords;
    }

    async hasFullAccess(params: HasFullAccessParams) {
        if (params.model.authorization === false) {
            return true;
        }

        const permissions = await this.getPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }

    /**
     * In order to do any operation with an entry, we must first check if
     * the identity has at least read permission on the content model.
     * @private
     */
    private canReadModel(model: CmsModel) {
        return this.modelsPermissions.canAccessModel({ model, rwd: "r" });
    }

    private hasRwd(permission: CmsEntryPermission, rwd: string) {
        return typeof permission.rwd !== "string" || permission.rwd.includes(rwd);
    }

    // Has publishing workflow permissions?
    private hasPw(permission: CmsEntryPermission, pw: string) {
        // `name` and `_src` properties are always present.
        const isCustom = Object.keys(permission).length > 2;

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
