import minimatch from "minimatch";
import { SecurityPermission } from "./types";

export type SecurityIdentityData = {
    id: string;
    displayName: string;
    type: string;
    permissions?: SecurityPermission[];
    logout(): void;
    getPermission?(permission: string): SecurityPermission;
    [key: string]: any;
};

export class SecurityIdentity {
    id: string;
    displayName: string;
    type: string;
    permissions: SecurityPermission[];
    [key: string]: any;

    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }

    /**
     * Create a new instance of SecurityIdentity from the existing instance.
     */
    static from(identity: SecurityIdentity, data: Partial<SecurityIdentityData>) {
        const currentData = Object.keys(identity).reduce((acc, key) => {
            acc[key] = identity[key];
            return acc;
        }, {}) as SecurityIdentityData;

        return new SecurityIdentity({ ...currentData, ...data });
    }

    getPermission<T extends SecurityPermission = SecurityPermission>(name: string): T {
        const perms = this.permissions || [];
        const exactMatch = perms.find(p => p.name === name) as T;
        if (exactMatch) {
            return exactMatch;
        }

        // Try matching using patterns
        return perms.find(p => minimatch(name, p.name)) as T;
    }

    logout() {
        console.warn(`You must implement a "logout" method when setting SecurityIdentity!`);
    }
}
