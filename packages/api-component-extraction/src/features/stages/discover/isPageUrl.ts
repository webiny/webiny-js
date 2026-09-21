/*
 * Whether a URL addresses something we could capture as a page.
 *
 * Both sources produce non-pages. A crawl picks up links to PDFs, images and downloads; a sitemap index
 * lists child sitemaps, and a wrongly generated sitemap can list assets outright. Capturing one of those
 * wastes a page of the cap and hands segmentation a document with no design in it.
 */

const NON_PAGE_EXTENSION =
    /\.(xml|json|txt|csv|rss|atom|pdf|zip|gz|tgz|bz2|rar|7z|doc|docx|xls|xlsx|ppt|pptx|odt|ods|jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|mp[34]|m4[av]|webm|mov|avi|wav|ogg|flac|woff2?|ttf|otf|eot|css|js|mjs|cjs|map|dmg|exe|apk|pkg|deb|rpm)$/i;

export const isPageUrl = (url: string): boolean => {
    let pathname: string;
    try {
        pathname = new URL(url).pathname;
    } catch {
        return false;
    }

    return !NON_PAGE_EXTENSION.test(pathname);
};
