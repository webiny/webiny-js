import { CloudFrontResponse } from "./types";
import { setHeader } from "./headers";

interface RedirectParams {
    url: string;
    query?: string;
    status?: number;
}

export function redirectResponse(params: RedirectParams): CloudFrontResponse {
    const query = params.query || "";
    const permanent = params.status === 301;

    const response: CloudFrontResponse = {
        status: String(params.status || 302),
        statusDescription: permanent ? "Moved permanently" : "Found",
        headers: {}
    };

    setHeader(response.headers, {
        key: "location",
        value: params.url + query
    });

    if (!permanent) {
        // for temporary redirects make sure they won't be cached
        setHeader(response.headers, {
            key: "cache-control",
            value: "no-cache, no-store, must-revalidate"
        });
        setHeader(response.headers, {
            key: "pragma",
            value: "no-cache"
        });
        setHeader(response.headers, {
            key: "expires",
            value: "0"
        });
    }

    return response;
}
