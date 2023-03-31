export interface TenantItem {
    id: string;
    name: string;
    description: string;
    tags: string[];
    parent: string | null;
    settings?: {
        domains?: { fqdn: string };
        themes?: string[];
    };
}
