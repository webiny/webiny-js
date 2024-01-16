import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { IImportPagesInput } from "./types";
import { PbImportExportContext } from "~/graphql/types";

export const importPages = async (
    params: ITaskRunParams<PbImportExportContext, IImportPagesInput>
): Promise<ITaskResponseResult> => {
    return {} as ITaskResponseResult;
};
