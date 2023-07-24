const DEFAULT_WCP_API_URL = "https://api.webiny.com";
const DEFAULT_WCP_APP_URL = "https://app.webiny.com";

const getWcpApiUrl = path => {
    const apiUrl = process.env.WCP_API_URL || DEFAULT_WCP_API_URL;
    return path ? apiUrl + path : apiUrl;
};

const getWcpGqlApiUrl = path => {
    const graphqlApi = getWcpApiUrl("/graphql");
    return path ? graphqlApi + path : graphqlApi;
};

const getWcpAppUrl = path => {
    const appUrl = process.env.WCP_APP_URL || DEFAULT_WCP_APP_URL;
    return path ? appUrl + path : appUrl;
};

module.exports = { getWcpAppUrl, getWcpApiUrl, getWcpGqlApiUrl };
