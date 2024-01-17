import { IExportPagesZipPagesTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export const exportPagesZipPages = async (
    params: IExportPagesZipPagesTaskParams
): Promise<ITaskResponseResult> => {
    const { response, input } = params;

    return response.done();
};
