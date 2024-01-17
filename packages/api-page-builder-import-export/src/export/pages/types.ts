import { ITaskRunParams } from "@webiny/tasks";
import { PbImportExportContext } from "~/types";

export enum PageExportTask {
    Controller = "pageBuilderExportPagesController",
    ZipPages = "pageBuilderExportPagesZipPages",
    CombineZippedPages = "pageBuilderExportPagesCombineZippedPages"
}

/**
 * Controller
 */
export interface IExportPagesControllerInput {
    where?: Record<string, any>;
    after?: string | null;
    sort?: string[];
    currentBatch?: number;
    processing?: boolean;
    combining?: string;
}

export type IExportPagesControllerTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesControllerInput
>;

/**
 * Zip Pages
 */
export interface IExportPagesZipPagesInput {
    queue: string[];
    done: string[];
}
export type IExportPagesZipPagesTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesZipPagesInput
>;

/**
 * Combine Zipped Pages
 */
export interface IExportPagesCombineZippedPagesInput {}

export type IExportPagesCombineZippedPagesTaskParams = ITaskRunParams<
    PbImportExportContext,
    IExportPagesCombineZippedPagesInput
>;
