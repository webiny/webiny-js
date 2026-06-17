import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";
import type { CustomDomainParams } from "~/pulumi/apps/customDomain.js";

export interface ISetAdminCustomDomains {
    execute(app: AdminPulumiApp, params: CustomDomainParams): void;
}

export const SetAdminCustomDomains =
    createAbstraction<ISetAdminCustomDomains>("SetAdminCustomDomains");

export namespace SetAdminCustomDomains {
    export type Interface = ISetAdminCustomDomains;
    export type Params = CustomDomainParams;
}
