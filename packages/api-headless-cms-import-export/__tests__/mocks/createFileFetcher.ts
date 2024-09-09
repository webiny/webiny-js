import {
    IFileFetcher,
    IFileFetcherStreamCallable,
    IFileFetcherListCallable
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
        ...params
    };
};
