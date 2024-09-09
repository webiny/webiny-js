import { HeadObjectCommandOutput, GetObjectCommandOutput } from "@webiny/aws-sdk/client-s3";
import { Readable } from "stream";

export interface IFileFetcherFile {
    key: string;
    name: string;
    size: number;
}

export type IFileFetcherStream = Readable;
export type IFileFetcherFetchResult = GetObjectCommandOutput;

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
    (key: string): Promise<IFileFetcherFetchResult | null>;
}

export interface IFileFetcherStreamCallable {
    (key: string): Promise<IFileFetcherStream | null>;
}

export interface IFileFetcherReadCallable {
    (key: string): Promise<string | null>;
}

export interface IFileFetcher {
    exists: IFileFetcherExistsCallable;
    head: IFileFetcherHeadCallable;
    list: IFileFetcherListCallable;
    fetch: IFileFetcherFetchCallable;
    stream: IFileFetcherStreamCallable;
    read: IFileFetcherReadCallable;
}
