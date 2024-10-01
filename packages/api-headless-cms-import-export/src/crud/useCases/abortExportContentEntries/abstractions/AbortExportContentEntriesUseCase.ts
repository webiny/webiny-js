import type { ICmsImportExportRecord } from "~/domain";

export interface IAbortExportContentEntriesUseCaseExecuteParams {
    id: string;
}

export interface IAbortExportContentEntriesUseCase {
    execute(
        params: IAbortExportContentEntriesUseCaseExecuteParams
    ): Promise<ICmsImportExportRecord>;
}
