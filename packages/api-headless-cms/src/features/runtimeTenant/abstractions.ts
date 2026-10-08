import { createAbstraction } from "@webiny/feature/api";

interface HasTenant {
    tenant: string;
}

export interface IRuntimeTenant {
    assign<T extends HasTenant>(obj: T): T;
}

export const RuntimeTenant = createAbstraction<IRuntimeTenant>("Cms/RuntimeTenant");

export namespace RuntimeTenant {
    export type Interface = IRuntimeTenant;
}
