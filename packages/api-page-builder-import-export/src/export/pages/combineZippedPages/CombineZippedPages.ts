import { IExportPagesCombineZippedPagesTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export class CombineZippedPages {
    public async execute(
        params: IExportPagesCombineZippedPagesTaskParams
    ): Promise<ITaskResponseResult> {
        const { response } = params;

        return response.done();
    }
}
