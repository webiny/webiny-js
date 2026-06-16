import ValidationError from "~/validationError.js";

const IP_OCTET = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const RELATIVE_REGEX = /^\/.*$/;
const HREF_REGEX = /^(#|mailto:|tel:)\S*$/;

const isIpHostname = (hostname: string): boolean => {
    if (hostname.includes(":")) {
        return true;
    }
    const parts = hostname.split(".");
    return parts.length === 4 && parts.every(part => IP_OCTET.test(part));
};

const isValidUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false;
        }
        const hostname = url.hostname;
        return hostname === "localhost" || isIpHostname(hostname) || hostname.includes(".");
    } catch {
        return false;
    }
};

export default (value: any, params?: string[]) => {
    if (!value || !params) {
        return;
    }
    value = value + "";

    if (isValidUrl(value)) {
        if (!params.includes("noIp")) {
            return;
        }

        const url = new URL(value);
        if (!isIpHostname(url.hostname)) {
            return;
        }
    }

    if (params.includes("allowRelative")) {
        if (RELATIVE_REGEX.test(value)) {
            return;
        }
    }

    if (params.includes("allowHref")) {
        if (HREF_REGEX.test(value)) {
            return;
        }
    }

    throw new ValidationError("Value must be a valid URL.");
};
