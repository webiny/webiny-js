import { defineApiExtension } from "@webiny/project/defineExtension";
import { TenantBeforeDeleteHandler } from "~/features/tenancy/DeleteTenant/index.js";

export const TenantBeforeDelete = defineApiExtension({
    type: "Tenancy/TenantBeforeDelete",
    description: "Add custom logic to be executed before a tenant is deleted.",
    abstraction: TenantBeforeDeleteHandler
});
