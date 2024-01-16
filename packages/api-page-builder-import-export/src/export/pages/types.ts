export enum PageExportTask {
    Controller = "pageBuilderExportPagesController",
    Batch = "pageBuilderExportPagesBatch",
    Zipping = "pageBuilderExportPagesZipping"
}

export interface IExportPagesControllerInput {
    where?: Record<string, any>;
    after?: string | null;
    sort?: string[];
    currentBatch?: number;
    processing?: boolean;
    zipping?: string;
}

export interface IExportPagesBatchInput {
    queue: string[];
    done: string[];
}
