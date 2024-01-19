import { IExportPagesZipPagesTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export class ExportPagesZipPages {
    public async execute(params: IExportPagesZipPagesTaskParams): Promise<ITaskResponseResult> {
        const { isAborted, response } = params;
        if (isAborted()) {
            return response.aborted();
        }
        const { ZipPages } = await import("./zipPages/ZipPages");

        const zipPages = new ZipPages();
        return await zipPages.execute(params);
    }
}
