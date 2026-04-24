import { Abstraction } from "@webiny/di";

export interface Tenant {
    id: string;
    name: string;
}

export interface ITenantContext {
    getCurrentTenant(): string | null;
    setTenant(tenantId: string | null): void;
    onTenantChange(callback: (tenantId: string | null) => void): () => void;
}

export const TenantContext = new Abstraction<ITenantContext>("TenantContext");

export namespace TenantContext {
    export type Interface = ITenantContext;
}
