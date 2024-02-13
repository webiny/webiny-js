import { ITaskResponseDoneResultOutput, ITaskRunParams } from "@webiny/tasks";
import { PbImportExportContext } from "~/types";

export enum PageExportTask {
    Controller = "pageBuilderExportPagesController",
    ZipPages = "pageBuilderExportPagesZipPages",
    Cleanup = "pageBuilderExportPagesCleanup"
}

/**
 * Controller
 */
export interface IExportPagesControllerInput {
    type: "published" | "latest";
    where?: Record<string, any>;
    totalPages: number;
    after?: string | null;
    limit?: number;
    currentBatch?: number;
    zippingPages?: boolean;
}

export interface IExportPagesControllerOutput extends ITaskResponseDoneResultOutput {
    key: string;
    url: string;
}

export type IExportPagesControllerTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesControllerInput,
    IExportPagesControllerOutput
>;

/**
 * Zip Pages
 */
export interface IExportPagesZipPagesDone {
    [pageId: string]: string;
}
export interface IExportPagesZipPagesInput {
    type: "published" | "latest";
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

export interface IExportPagesCombineZippedPagesOutput extends ITaskResponseDoneResultOutput {
    key: string;
    url: string;
}

export type IExportPagesCombineZippedPagesParams = Pick<
    ITaskRunParams<
        PbImportExportContext,
        IExportPagesControllerInput,
        IExportPagesCombineZippedPagesOutput
    >,
    "store" | "response"
>;

/**
 * Cleanup Zip files
 */
export type IExportPagesCleanupInput = Record<string, boolean>;

export type IExportPagesCleanupTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesCleanupInput
>;
