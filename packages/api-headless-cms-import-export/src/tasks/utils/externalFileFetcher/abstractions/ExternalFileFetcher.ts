import type { GenericRecord } from "@webiny/api/types";

export interface IExternalFileFetcherHeadFile {
    url: string;
    name: string;
    size: number;
    contentType: string;
    checksum: string;
}

export interface IExternalFileFetcherFetchFile extends IExternalFileFetcherHeadFile {
    body: ReadableStream<Uint8Array>;
}

export interface IExternalFileFetcherError {
    message: string;
    code: string;
    data: GenericRecord;
}

export type IExternalFileFetcherHeadResult =
    | {
          file: IExternalFileFetcherHeadFile;
          error?: never;
      }
    | {
          file?: never;
          error: IExternalFileFetcherError;
      };

export type IExternalFileFetcherFetchResult =
    | {
          file: IExternalFileFetcherFetchFile;
          error?: never;
      }
    | {
          file?: never;
          error: IExternalFileFetcherError;
      };

export interface IExternalFileFetcherFetchCallable {
    (key: string): Promise<IExternalFileFetcherFetchResult>;
}

export interface IExternalFileFetcherHeadCallable {
    (key: string): Promise<IExternalFileFetcherHeadResult>;
}

export interface IExternalFileFetcher {
    fetch: IExternalFileFetcherFetchCallable;
    head: IExternalFileFetcherHeadCallable;
}
