import { getHeader } from "./headers";
import { CloudFrontRequest, CloudFrontResponse } from "./types";

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
