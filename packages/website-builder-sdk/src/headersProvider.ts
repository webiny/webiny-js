export type HeadersProvider = () => Promise<Headers>;

let headersProvider: HeadersProvider;

export const setHeadersProvider = (provider: HeadersProvider) => {
    headersProvider = provider;
};

export const getHeadersProvider = () => headersProvider;
