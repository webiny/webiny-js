import { CloudFrontResponse } from "./types";

export interface CookieParams {
    name: string;
    value: string;
    maxAge?: number;
}

/** Sets cookie for the HTTP response */
export function setResponseCookie(response: CloudFrontResponse, cookie: CookieParams) {
    const cookies = response.cookies || (response.cookies = {});

    const current = cookies[cookie.name];
    let attrs = `Secure; Path=/;`;

    if (cookie.maxAge) {
        attrs += ` Max-Age=${cookie.maxAge};`;
    }

    if (current) {
        // If there is already the same cookie set in a response,
        // we add another entry using `multivalue`.
        // This is how you set multiple same cookies in CloudFront Functions.
        // It DOES make sense to set the same cookie multiple times,
        // for example when dealing with SameSite issue (https://web.dev/samesite-cookies-explained/)
        const multivalue = current.multivalue ?? (current.multivalue = []);
        multivalue.push({
            value: cookie.value,
            attributes: attrs
        });
    } else {
        cookies[cookie.name] = {
            value: cookie.value,
            attributes: attrs
        };
    }
}
