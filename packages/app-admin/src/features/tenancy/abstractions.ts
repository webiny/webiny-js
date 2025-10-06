import { Abstraction } from "@webiny/di-container";

export interface Tenant {
    id: string;
    name: string;
}

export interface ITenancyService {
    getCurrentTenant(): string | null;
    setTenant(tenantId: string | null): void;
    getIsMultiTenant(): boolean;
    onTenantChange(callback: (tenantId: string | null) => void): () => void;
}

export const TenancyService = new Abstraction<ITenancyService>("TenancyService");

export namespace TenancyService {
    export type Interface = ITenancyService;
}
