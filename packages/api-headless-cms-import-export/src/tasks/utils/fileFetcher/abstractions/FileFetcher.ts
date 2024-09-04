import { HeadObjectCommandOutput } from "@webiny/aws-sdk/client-s3";
import { Readable } from "stream";

export interface IFileFetcherFile {
    key: string;
    name: string;
    size: number;
}

export type IFileFetcherReadable = Readable;

export interface IFileFetcherExistsCallable {
    (key: string): Promise<boolean>;
}

export type IFileFetcherHeadResult = HeadObjectCommandOutput;

export interface IFileFetcherHeadCallable {
    (key: string): Promise<IFileFetcherHeadResult>;
}

export interface IFileFetcherListCallable {
    (key: string): Promise<IFileFetcherFile[]>;
}

export interface IFileFetcherFetchCallable {
    (key: string): Promise<IFileFetcherReadable | null>;
}

export interface IFileFetcher {
    exists: IFileFetcherExistsCallable;
    head: IFileFetcherHeadCallable;
    list: IFileFetcherListCallable;
    fetch: IFileFetcherFetchCallable;
}
