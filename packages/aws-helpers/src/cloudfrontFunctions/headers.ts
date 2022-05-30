import { CloudFrontHeaders, Header } from "./types";

export function getHeader(headers: CloudFrontHeaders, header: string) {
    return headers[header]?.value;
}

export function setHeader(headers: CloudFrontHeaders, header: Header) {
    headers[header.key] = {
        value: header.value
    };
}

export function setHeaders(headers: CloudFrontHeaders, headersToSet: Header[]) {
    for (let i = 0; i < headersToSet.length; i++) {
        setHeader(headers, headersToSet[i]);
    }
}

export function setNoCacheHeaders(headers: CloudFrontHeaders) {
    headers["cache-control"] = { value: "no-cache, no-store, must-revalidate" };
    headers["pragma"] = { value: "no-cache" };
    headers["expires"] = { value: "0" };
}
