/** The last two path segments of a URL, without its query: how render audits compare image URLs. */
export const imageUrlTail = (url: string): string =>
    url.split("?")[0].split("/").slice(-2).join("/");

/**
 * How many distinct images a rendered component showed: the image URLs the page used (`<img>`
 * sources and CSS backgrounds), counted once each, less any that failed to load. Compared by
 * `imageUrlTail`, since a CDN may answer one image under different query strings.
 */
export const renderedImageCount = (used: string[], failed: string[]): number => {
    const failedTails = new Set(failed.map(imageUrlTail));
    return new Set(
        used
            .filter(url => url && !url.startsWith("data:"))
            .map(imageUrlTail)
            .filter(tail => !failedTails.has(tail))
    ).size;
};
