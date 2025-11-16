import {defineApiExtension} from "@webiny/project/defineExtension";
import { TenantBeforeUpdateHandler } from "~/features/tenancy/UpdateTenant/index.js";

export const TenantBeforeUpdate = defineApiExtension({
    type: "Tenancy/TenantBeforeUpdate",
    description: "Add custom logic to be executed before a tenant is updated.",
    abstraction: TenantBeforeUpdateHandler
});
