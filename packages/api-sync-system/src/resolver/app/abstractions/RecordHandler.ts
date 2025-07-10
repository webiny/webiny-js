import type { IIngestorResult } from "~/resolver/app/ingestor/types.js";

export interface IRecordHandlerHandleParams {
    data: IIngestorResult;
}

export interface IRecordHandler {
    handle(params: IRecordHandlerHandleParams): Promise<void>;
}
