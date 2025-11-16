import {defineApiExtension} from "@webiny/project/defineExtension";
import { TenantInstalledHandler } from "~/features/tenancy/InstallTenant/index.js";

export const TenantInstalled = defineApiExtension({
    type: "Tenancy/TenantInstalled",
    description: "Add custom logic to be executed after a tenant is installed.",
    abstraction: TenantInstalledHandler
});
