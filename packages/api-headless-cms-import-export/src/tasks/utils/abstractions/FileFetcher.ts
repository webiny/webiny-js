import { Readable } from "stream";

export interface IFileFetcherFile {
    key: string;
    name: string;
    size: number;
}

export type IFileFetcherReadable = Readable | null;

export interface IFileFetcherListCallable {
    (key: string): Promise<IFileFetcherFile[]>;
}

export interface IFileFetcherFetchCallable {
    (key: string): Promise<IFileFetcherReadable>;
}

export interface IFileFetcher {
    list: IFileFetcherListCallable;
    fetch: IFileFetcherFetchCallable;
}
