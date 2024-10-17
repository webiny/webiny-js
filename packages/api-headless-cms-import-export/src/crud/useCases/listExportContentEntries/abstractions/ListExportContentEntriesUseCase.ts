import type { IListExportContentEntriesResult, IListExportContentEntriesParams } from "~/types";

export type IListExportContentEntriesUseCaseExecuteParams = IListExportContentEntriesParams;

export type IListExportContentEntriesUseCaseExecuteResult = IListExportContentEntriesResult;

export interface IListExportContentEntriesUseCase {
    execute(
        params?: IListExportContentEntriesUseCaseExecuteParams
    ): Promise<IListExportContentEntriesUseCaseExecuteResult>;
}
