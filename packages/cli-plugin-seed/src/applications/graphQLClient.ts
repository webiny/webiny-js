import { GraphQLClient } from "graphql-request";

export interface Params {
    url: string;
    headers?: {
        Bearer?: string;
        [key: string]: string;
    };
}
export const createHeadlessCmsManageClient = (params: Params) => {
    const { url, headers } = params;
    return null;
    if (url.match(/\/manage\//) === null) {
        throw new Error(
            `Url received when setting up manage client does not contain required "/manage/" in it: ${url}`
        );
    }
    return new GraphQLClient(url, {
        headers: headers || {}
    });
};
