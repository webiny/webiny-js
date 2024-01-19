import { ITaskResponseDoneResultOutput, ITaskRunParams } from "@webiny/tasks";
import { PbImportExportContext } from "~/types";

export enum PageExportTask {
    Controller = "pageBuilderExportPagesController",
    ZipPages = "pageBuilderExportPagesZipPages",
    CombineZippedPages = "pageBuilderExportPagesCombineZippedPages",
    Cleanup = "pageBuilderExportPagesCleanup"
}

/**
 * Controller
 */
export interface IExportPagesControllerInput {
    where?: Record<string, any>;
    after?: string | null;
    limit?: number;
    currentBatch?: number;
    zippingPages?: boolean;
    combiningZips?: string;
}

export type IExportPagesControllerTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesControllerInput
>;

/**
 * Zip Pages
 */
export interface IExportPagesZipPagesDone {
    [pageId: string]: string;
}
export interface IExportPagesZipPagesInput {
    queue: string[];
    done?: IExportPagesZipPagesDone;
    failed?: string[];
}

export interface IExportPagesZipPagesOutput extends ITaskResponseDoneResultOutput {
    done: IExportPagesZipPagesDone;
    failed: string[];
}

export type IExportPagesZipPagesTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesZipPagesInput,
    IExportPagesZipPagesOutput
>;

/**
 * Combine Zipped Pages
 */
export interface IExportPagesCombineZippedPagesInput {
    after?: string | null;
}

export interface IExportPagesCombineZippedPagesOutput extends ITaskResponseDoneResultOutput {
    key: string;
    url: string;
}

export type IExportPagesCombineZippedPagesTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesCombineZippedPagesInput,
    IExportPagesCombineZippedPagesOutput
>;

/**
 * Cleanup Zip files
 */
export type IExportPagesCleanupInput = Record<string, boolean>;

export type IExportPagesCleanupTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesCleanupInput
>;
