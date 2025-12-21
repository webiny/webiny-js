import type { Tenant } from "~/types/tenancy.js";

export class RootTenant {
    static create(): Tenant {
        return {
            id: "root",
            name: "Root",
            isInstalled: false
        } as Tenant;
    }
}
