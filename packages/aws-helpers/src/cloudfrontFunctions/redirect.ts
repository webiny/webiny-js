import { CloudFrontQuery, CloudFrontResponse } from "./types";
import { setNoCacheHeaders } from "./headers";
import { stringifyQuery } from "./querystring";

interface RedirectParams {
    url: string;
    query?: CloudFrontQuery;
    status?: number;
}

export function redirectResponse(params: RedirectParams) {
    const query = params.query ? stringifyQuery(params.query) : "";
    const permanent = params.status === 301;

    const response: CloudFrontResponse = {
        statusCode: params.status || 302,
        statusDescription: params.status === 301 ? "Moved permanently" : "Found",
        headers: {
            location: { value: params.url + query }
        }
    };

    if (!permanent) {
        // For temporary redirects make sure they won't be cached.
        setNoCacheHeaders(response.headers);
    }

    return response;
}
