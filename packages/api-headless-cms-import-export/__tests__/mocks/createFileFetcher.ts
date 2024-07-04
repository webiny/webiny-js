import {
    IFileFetcher,
    IFileFetcherFetchCallable,
    IFileFetcherListCallable
} from "~/tasks/utils/fileFetcher";

export interface ICreateFileFetcherParams {
    list?: IFileFetcherListCallable;
    fetch?: IFileFetcherFetchCallable;
}

export const createFileFetcher = (params?: ICreateFileFetcherParams): IFileFetcher => {
    return {
        list: async () => {
            return [];
        },
        fetch: async () => {
            return null;
        },
        ...params
    };
};
