import { IExportPagesCombineZippedPagesTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { CombineZippedPages } from "./combineZippedPages/CombineZippedPages";

export class ExportPagesCombineZippedPages {
    public async execute(
        params: IExportPagesCombineZippedPagesTaskParams
    ): Promise<ITaskResponseResult> {
        const { isAborted, response } = params;
        if (isAborted()) {
            return response.aborted();
        }

        const combineZippedPages = new CombineZippedPages();
        return combineZippedPages.execute(params);
    }
}
