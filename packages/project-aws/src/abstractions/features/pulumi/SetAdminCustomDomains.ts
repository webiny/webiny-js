import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";
import type { CustomDomainParams } from "~/pulumi/apps/customDomain.js";

export interface ISetAdminCustomDomains {
    execute(
        cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
        params: CustomDomainParams
    ): void;
}

export const SetAdminCustomDomains =
    createAbstraction<ISetAdminCustomDomains>("SetAdminCustomDomains");

export namespace SetAdminCustomDomains {
    export type Interface = ISetAdminCustomDomains;
}
