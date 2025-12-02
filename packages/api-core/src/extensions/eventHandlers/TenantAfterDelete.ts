import { defineApiExtension } from "@webiny/project/defineExtension";
import { TenantAfterDeleteHandler } from "~/features/tenancy/DeleteTenant/index.js";

export const TenantAfterDelete = defineApiExtension({
    type: "Tenancy/TenantAfterDelete",
    description: "Add custom logic to be executed after a tenant is deleted.",
    abstraction: TenantAfterDeleteHandler
});
