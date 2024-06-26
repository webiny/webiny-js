import { Readable } from "stream";

export interface IFileFetcherFile {
    key: string;
    name: string;
    size: number;
}

export type IFileFetcherReadable = Readable | null;

export interface IFileFetcher {
    list: (key: string) => Promise<IFileFetcherFile[]>;
    fetch: (key: string) => Promise<IFileFetcherReadable>;
}
