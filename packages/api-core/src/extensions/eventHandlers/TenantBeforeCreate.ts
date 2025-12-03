import { defineApiExtension } from "@webiny/project/defineExtension";
import { TenantBeforeCreateHandler } from "~/features/tenancy/CreateTenant/index.js";

export const TenantBeforeCreate = defineApiExtension({
    type: "Tenancy/TenantBeforeCreate",
    description: "Add custom logic to be executed before a tenant is created.",
    abstraction: TenantBeforeCreateHandler
});
