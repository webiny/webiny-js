import {
    IExportPagesCombineZippedPagesTaskParams,
    IExportPagesZipPagesTaskParams
} from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export const exportPagesCombineZippedPages = async (
    params: IExportPagesCombineZippedPagesTaskParams
): Promise<ITaskResponseResult> => {
    const { response, input } = params;

    return response.done();
};
