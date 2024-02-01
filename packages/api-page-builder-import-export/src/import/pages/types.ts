import { ITaskRunParams } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";

export interface IImportPagesInput {
    file: string;
}

export type IImportPagesControllerTaskParams = ITaskRunParams<
    PbImportExportContext,
    IImportPagesInput
>;
