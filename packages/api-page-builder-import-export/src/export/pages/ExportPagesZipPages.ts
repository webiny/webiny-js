import { IExportPagesZipPagesTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { ZipPages } from "./zipPages/ZipPages";

export class ExportPagesZipPages {
    public async execute(params: IExportPagesZipPagesTaskParams): Promise<ITaskResponseResult> {
        const { isAborted, response } = params;
        if (isAborted()) {
            return response.aborted();
        }

        const zipPages = new ZipPages();
        return await zipPages.execute(params);
    }
}
