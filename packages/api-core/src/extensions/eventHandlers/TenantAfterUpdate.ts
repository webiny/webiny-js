import {defineApiExtension} from "@webiny/project/defineExtension";
import { TenantAfterUpdateHandler } from "~/features/tenancy/UpdateTenant/index.js";

export const TenantAfterUpdate = defineApiExtension({
    type: "Tenancy/TenantAfterUpdate",
    description: "Add custom logic to be executed after a tenant is updated.",
    abstraction: TenantAfterUpdateHandler
});
