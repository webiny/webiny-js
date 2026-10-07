/**
 * The frontend domain is loaded into preview iframes, so it has to be an http(s) URL. An empty value
 * is allowed and means "use the default domain".
 */
export const isValidFrontendDomain = (domain: string): boolean => {
    if (domain === "") {
        return true;
    }

    if (!URL.canParse(domain)) {
        return false;
    }

    const { protocol } = new URL(domain);
    return protocol === "http:" || protocol === "https:";
};
