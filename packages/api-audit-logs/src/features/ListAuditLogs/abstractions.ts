import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IListAuditLogsParams, IListAuditLogsSuccessResult } from "~/types.js";

export interface IListAuditLogsUseCase {
    execute(params: IListAuditLogsParams): Promise<Result<IListAuditLogsSuccessResult, Error>>;
}

export const ListAuditLogsUseCase =
    createAbstraction<IListAuditLogsUseCase>("ListAuditLogsUseCase");

export namespace ListAuditLogsUseCase {
    export type Interface = IListAuditLogsUseCase;
    export type Params = IListAuditLogsParams;
    export type Return = Promise<Result<IListAuditLogsSuccessResult, Error>>;
}
