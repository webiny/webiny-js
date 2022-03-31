import { CloudFrontResponse } from "./types";

export interface CookieParams {
    name: string;
    value: string;
    maxAge?: number;
}

export function setCookie(response: CloudFrontResponse, cookie: CookieParams) {
    const cookies = response.cookies || (response.cookies = {});

    const current = cookies[cookie.name];
    let attrs = `Secure; Path=/;`;

    if (cookie.maxAge) {
        attrs += ` Max-Age=${cookie.maxAge};`;
    }

    if (current) {
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
