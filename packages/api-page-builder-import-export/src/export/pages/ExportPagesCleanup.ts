import { IExportPagesCleanupTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export class ExportPagesCleanup {
    public async execute(params: IExportPagesCleanupTaskParams): Promise<ITaskResponseResult> {
        const { response } = params;
        return response.done();
    }
}
