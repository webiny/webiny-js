import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IAuditLog } from "~/storage/types.js";

export interface IGetAuditLogUseCase {
    execute(id: string): Promise<Result<IAuditLog | null, Error>>;
}

export const GetAuditLogUseCase = createAbstraction<IGetAuditLogUseCase>("GetAuditLogUseCase");

export namespace GetAuditLogUseCase {
    export type Interface = IGetAuditLogUseCase;
    export type Return = Promise<Result<IAuditLog | null, Error>>;
}
