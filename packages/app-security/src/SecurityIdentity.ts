import minimatch from "minimatch";

export type SecurityPermission = { name: string; [key: string]: any };

export type SecurityIdentityData = {
    id: string;
    login: string;
    permissions: SecurityPermission[];
    logout(): void;
    [key: string]: any;
    getPermission?(permission: string): SecurityPermission;
};

export class SecurityIdentity {
    id: string;
    login: string;
    permissions: SecurityPermission[];
    [key: string]: any;

    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }

    getPermission(permission): SecurityPermission {
        const perms = this.permissions;
        const exactMatch = perms.find(p => p.name === permission);
        if (exactMatch) {
            return exactMatch;
        }

        // Try matching using patterns
        if (perms.find(p => minimatch(permission, p.name))) {
            return { name: permission };
        }

        return null;
    }

    logout() {
        console.warn(`You must implement a "logout" method when setting SecurityIdentity!`);
    }
}
