import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { CustomDomainParams } from "./pulumiTypes.js";

export interface ISetApiCustomDomains {
    execute(params: CustomDomainParams): void;
}

export const SetApiCustomDomains = createAbstraction<ISetApiCustomDomains>("SetApiCustomDomains");

export namespace SetApiCustomDomains {
    export type Interface = ISetApiCustomDomains;
    export type Params = CustomDomainParams;
}
