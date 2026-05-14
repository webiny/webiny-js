import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";
import type { CustomDomainParams } from "~/pulumi/apps/customDomain.js";

export interface ISetApiCustomDomains {
    execute(
        cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>,
        params: CustomDomainParams
    ): void;
}

export const SetApiCustomDomains = createAbstraction<ISetApiCustomDomains>("SetApiCustomDomains");

export namespace SetApiCustomDomains {
    export type Interface = ISetApiCustomDomains;
}
