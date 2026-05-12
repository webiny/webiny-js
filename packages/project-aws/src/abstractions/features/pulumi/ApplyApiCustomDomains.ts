import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";
import type { CustomDomainParams } from "~/pulumi/apps/customDomain.js";

export interface IApplyApiCustomDomains {
    apply(app: ApiPulumiApp, params: CustomDomainParams): void;
}

export const ApplyApiCustomDomains =
    createAbstraction<IApplyApiCustomDomains>("ApplyApiCustomDomains");

export namespace ApplyApiCustomDomains {
    export type Interface = IApplyApiCustomDomains;
}
