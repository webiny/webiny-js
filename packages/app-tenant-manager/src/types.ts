export interface TenantItem {
    id: string;
    name: string;
    description: string;
    parent: string | null;
    settings?: {
        themes?: string[];
    };
}
