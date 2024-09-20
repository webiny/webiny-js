import type { ICmsImportExportRecord } from "~/domain";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";

export interface IExportContentEntriesUseCaseExecuteParams {
    modelId: string;
    exportAssets: boolean;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
}

export interface IExportContentEntriesUseCase {
    execute(params: IExportContentEntriesUseCaseExecuteParams): Promise<ICmsImportExportRecord>;
}
