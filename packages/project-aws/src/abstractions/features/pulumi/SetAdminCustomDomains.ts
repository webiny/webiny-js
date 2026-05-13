import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { CustomDomainParams } from "~/pulumi/apps/customDomain.js";

export interface ISetAdminCustomDomains {
    execute(params: CustomDomainParams): void;
}

export const SetAdminCustomDomains =
    createAbstraction<ISetAdminCustomDomains>("SetAdminCustomDomains");

export namespace SetAdminCustomDomains {
    export type Interface = ISetAdminCustomDomains;
}
