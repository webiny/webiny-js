import { type IFetcherParams, Fetcher } from "~/resolver/app/fetcher/Fetcher.js";

export const createMockFetcher = (
    params: Pick<IFetcherParams, "createDocumentClient"> &
        Partial<Omit<IFetcherParams, "createDocumentClient">>
) => {
    return new Fetcher(params);
};
