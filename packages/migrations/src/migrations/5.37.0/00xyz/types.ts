export interface Tenant {
    data: {
        id: string;
        name: string;
    };
}

export type Permissions = Array<Record<string, any>>;

export interface TenantLink {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    identity: string;
    tenant: string;
    type: string;
    data: {
        // Old properties.
        group: string;
        permissions: Permissions;

        // New properties.

        // Groups is an array of objects with `id` and `permissions` properties.
        // Note that, despite the property accepting an array, we only allow a single group to be
        // assigned to a tenant link.
        groups: Array<{ id: string; permissions: Permissions }>;

        // In the migration process, we set `teams` property to an empty array.
        teams: [];
    };
}
