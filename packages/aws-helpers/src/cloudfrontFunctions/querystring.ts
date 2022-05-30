import { CloudFrontQuery } from "./types";

export function stringifyQuery(query: CloudFrontQuery) {
    let qs = "";

    for (const key of Object.keys(query)) {
        const value = query[key];
        if (!value) {
            continue;
        }

        qs = appendQueryString(qs, key, value?.value);

        if (value.multivalue) {
            for (let i = 0; i < value.multivalue.length; i++) {
                qs = appendQueryString(qs, key, value.multivalue[i].value);
            }
        }
    }

    if (qs) {
        qs = "?" + qs;
    }

    return qs;
}

function appendQueryString(qs: string, key: string, value: string | null) {
    if (value === null) {
        return qs;
    }

    if (qs.length) {
        qs += "&";
    }

    qs += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;

    return qs;
}
