import { ITaskResponseDoneResultOutput, ITaskRunParams } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import { ImportData } from "~/types";

export enum PageImportTask {
    Controller = "pageBuilderImportPagesController",
    Process = "pageBuilderImportPagesProcess",
    Cleanup = "pageBuilderImportPagesCleanup"
}

export interface IImportPagesControllerInputIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface IImportPagesControllerInputMeta {
    [key: string]: any;
}
/**
 * Controller
 */
export interface IImportPagesControllerInput {
    category: string;
    zipFileUrl: string;
    meta?: IImportPagesControllerInputMeta;
    processing?: boolean;
    identity: IImportPagesControllerInputIdentity;
}

export interface IImportPagesControllerOutput extends ITaskResponseDoneResultOutput {
    total: number;
}
export type IImportPagesControllerTaskParams = ITaskRunParams<
    PbImportExportContext,
    IImportPagesControllerInput,
    IImportPagesControllerOutput
>;

/**
 * Process Pages.
 */
export interface IImportPagesProcessPagesInput {
    category: string;
    meta?: IImportPagesControllerInputMeta;
    identity: IImportPagesControllerInputIdentity;
    items: ImportData[];
    done: string[];
    failed: string[];
    pageIdList: string[];
}

export interface IImportPagesProcessPagesOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    failed: string[];
    pageIdList: string[];
}

export type IImportPagesProcessPagesTaskParams = ITaskRunParams<
    PbImportExportContext,
    IImportPagesProcessPagesInput,
    IImportPagesProcessPagesOutput
>;
