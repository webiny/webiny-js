import {
    IFileFetcher,
    IFileFetcherListCallable,
    IFileFetcherStreamCallable
} from "~/tasks/utils/fileFetcher";

export interface ICreateFileFetcherParams {
    list?: IFileFetcherListCallable;
    fetch?: IFileFetcherStreamCallable;
}

export const createFileFetcher = (params?: ICreateFileFetcherParams): IFileFetcher => {
    return {
        list: async () => {
            return [];
        },
        stream: async () => {
            return null;
        },
        delete: async () => {
            return {} as any;
        },
        exists: async () => {
            return false;
        },
        read: async () => {
            return null;
        },
        // @ts-expect-error
        fetch: async () => {
            return null;
        },
        head: async () => {
            return null;
        },
        ...params
    };
};
