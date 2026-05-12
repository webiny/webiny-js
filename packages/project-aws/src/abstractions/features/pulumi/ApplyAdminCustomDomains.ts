import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";
import type { CustomDomainParams } from "~/pulumi/apps/customDomain.js";

export interface IApplyAdminCustomDomains {
    apply(app: AdminPulumiApp, params: CustomDomainParams): void;
}

export const ApplyAdminCustomDomains =
    createAbstraction<IApplyAdminCustomDomains>("ApplyAdminCustomDomains");

export namespace ApplyAdminCustomDomains {
    export type Interface = IApplyAdminCustomDomains;
}
