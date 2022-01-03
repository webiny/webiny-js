import { CloudFrontHeaders, CloudFrontRequest, CloudFrontResponse } from "@webiny/aws-helpers";

export function setHeader(headers: CloudFrontHeaders, header: { key: string; value: string }) {
    headers[header.key] = [header];
}

export function getHeader(headers: CloudFrontHeaders | undefined, header: string) {
    return headers?.[header]?.[0].value;
}

export function getRequestCookies(request: CloudFrontRequest) {
    const header = getHeader(request.headers, "cookie");
    const cookies: Record<string, string | undefined> = {};

    if (!header) {
        return cookies;
    }

    const cookiesArray = decodeURIComponent(header).split(";");

    for (const cookie of cookiesArray) {
        const [name, value] = cookie.trim().split("=");
        cookies[name] = value;
    }

    return cookies;
}

export function setResponseCookie(response: CloudFrontResponse, cookie: string) {
    const headers = response.headers;
    const cookies = headers["set-cookie"] || (headers["set-cookie"] = []);

    cookies.push({
        value: cookie
    });
}

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
