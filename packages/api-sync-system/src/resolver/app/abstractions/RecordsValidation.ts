import type { SQSRecord } from "@webiny/aws-sdk/types";
import type { IResolverSQSRecord } from "~/resolver/app/abstractions/ResolverRecord.js";

export interface IRecordsValidationValid {
    records: IResolverSQSRecord[];
    error?: never;
}

export interface IRecordsValidationError {
    records?: never;
    error: Error;
}

export type IRecordsValidationResult = IRecordsValidationValid | IRecordsValidationError;

export interface IRecordsValidation {
    validate(records: SQSRecord[]): Promise<IRecordsValidationResult>;
}
