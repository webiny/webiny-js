import { IExportPagesCombineZippedPagesTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export class ExportPagesCombineZippedPages {
    public async execute(
        params: IExportPagesCombineZippedPagesTaskParams
    ): Promise<ITaskResponseResult> {
        const { isAborted, response } = params;
        if (isAborted()) {
            return response.aborted();
        }

        const { CombineZippedPages } = await import("./combineZippedPages/CombineZippedPages");
        const combineZippedPages = new CombineZippedPages();
        return combineZippedPages.execute(params);
    }
}
