import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { AuditAction } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { CreateAuditLogUseCase } from "~/features/CreateAuditLog/abstractions.js";

export interface RecordAuditLogInput {
    audit: AuditAction;
    message: string;
    content: GenericRecord;
    entityId: string;
}

/**
 * RecordAuditLog Use Case - Records an audit log for something the current identity did. Returns
 * null when nothing was recorded: there's no identity, or merging into an earlier log failed.
 */
export interface IRecordAuditLogUseCase {
    execute(input: RecordAuditLogInput): Promise<Result<IAuditLog | null, UseCaseError>>;
}

type UseCaseError = CreateAuditLogUseCase.Error;

export const RecordAuditLogUseCase =
    createAbstraction<IRecordAuditLogUseCase>("RecordAuditLogUseCase");

export namespace RecordAuditLogUseCase {
    export type Interface = IRecordAuditLogUseCase;
    export type Input = RecordAuditLogInput;
    export type Error = UseCaseError;
}
