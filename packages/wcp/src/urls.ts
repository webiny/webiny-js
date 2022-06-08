const DEFAULT_WCP_API_URL = "https://d3mudimnmgk2a9.cloudfront.net";
const DEFAULT_WCP_APP_URL = "https://app.webiny.com";

export const getWcpApiUrl = (path?: string) => {
    const apiUrl = process.env.WCP_API_URL || DEFAULT_WCP_API_URL;
    return path ? apiUrl + path : apiUrl;
};

export const getWcpGqlApiUrl = (path?: string) => {
    const graphqlApi = getWcpApiUrl("/graphql");
    return path ? graphqlApi + path : graphqlApi;
};

export const getWcpAppUrl = (path?: string) => {
    const appUrl = process.env.WCP_APP_URL || DEFAULT_WCP_APP_URL;
    return path ? appUrl + path : appUrl;
};
