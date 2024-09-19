import type { ICmsImportExportRecord } from "~/domain";

export interface IExportContentEntriesUseCaseExecuteParams {
    modelId: string;
    exportAssets: boolean;
    limit?: number;
}

export interface IExportContentEntriesUseCase {
    execute(params: IExportContentEntriesUseCaseExecuteParams): Promise<ICmsImportExportRecord>;
}
