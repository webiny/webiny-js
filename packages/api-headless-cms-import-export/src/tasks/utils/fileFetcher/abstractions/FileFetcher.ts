import type {
    DeleteObjectCommandOutput,
    GetObjectCommandOutput,
    HeadObjectCommandOutput
} from "@webiny/aws-sdk/client-s3";
import type { Readable } from "stream";

export interface IFileFetcherFile {
    key: string;
    name: string;
    size: number;
}

export type IFileFetcherStream = Readable | null;
export type IFileFetcherFetchResult = GetObjectCommandOutput | null;

export interface IFileFetcherExistsCallable {
    (key: string): Promise<boolean>;
}

export type IFileFetcherHeadResult = HeadObjectCommandOutput | null;

export interface IFileFetcherHeadCallable {
    (key: string): Promise<IFileFetcherHeadResult>;
}

export interface IFileFetcherListCallable {
    (key: string): Promise<IFileFetcherFile[]>;
}

export interface IFileFetcherFetchCallable {
    (key: string): Promise<IFileFetcherFetchResult>;
}

export interface IFileFetcherStreamCallable {
    (key: string): Promise<IFileFetcherStream>;
}

export interface IFileFetcherReadCallable {
    (key: string): Promise<string | null>;
}

export interface IFileFetcherDeleteCallable {
    (key: string): Promise<DeleteObjectCommandOutput>;
}

export interface IFileFetcher {
    exists: IFileFetcherExistsCallable;
    head: IFileFetcherHeadCallable;
    list: IFileFetcherListCallable;
    fetch: IFileFetcherFetchCallable;
    stream: IFileFetcherStreamCallable;
    read: IFileFetcherReadCallable;
    delete: IFileFetcherDeleteCallable;
}
