import type { ICmsImportExportRecord } from "~/domain/abstractions/CmsImportExportRecord";

export interface IGetExportContentEntriesUseCaseExecuteParams {
    id: string;
}

export type IGetExportContentEntriesUseCaseExecuteResponse = ICmsImportExportRecord;

export interface IGetExportContentEntriesUseCase {
    execute(
        params: IGetExportContentEntriesUseCaseExecuteParams
    ): Promise<IGetExportContentEntriesUseCaseExecuteResponse | null>;
}
