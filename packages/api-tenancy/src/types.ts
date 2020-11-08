export type Tenant = {
    id: string;
    name: string;
    parent: string | null;
};

export type HandlerTenancyContextObject = {
    withTenantId(value: string): string;
    getTenant(): Tenant;
    crud?: {
        getById(id: string): Promise<Tenant>;
        list(params: { parent?: string }): Promise<Tenant[]>;
        create(data: { name: string; parent: string }): Promise<Tenant>;
        update(id: string, data: { id: string; name: string; parent: string }): Promise<Tenant>;
        delete(id: string): Promise<boolean>;
    };
};

export type HandlerTenancyContext = {
    tenancy: HandlerTenancyContextObject;
};
