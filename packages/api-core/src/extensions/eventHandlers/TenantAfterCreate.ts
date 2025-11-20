import { defineApiExtension } from "@webiny/project/defineExtension";
import { TenantAfterCreateHandler } from "~/features/tenancy/CreateTenant/index.js";

export const TenantAfterCreate = defineApiExtension({
    type: "Tenancy/TenantAfterCreate",
    description: "Add custom logic to be executed after a tenant is created.",
    abstraction: TenantAfterCreateHandler
});
