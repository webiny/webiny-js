import type { SQSRecord } from "@webiny/aws-sdk/types/index.js";

export interface IResolverApplicationResolveParams {
    records: SQSRecord[];
}

export interface IResolverApplication {
    resolve(params: IResolverApplicationResolveParams): Promise<void>;
}
