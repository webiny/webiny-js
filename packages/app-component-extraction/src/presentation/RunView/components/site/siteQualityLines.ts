import type { SiteQualitiesDto } from "~/shared/types.js";

export interface QualityLine {
    key: "sitemap" | "images" | "seo";
    text: string;
    /** Something to open: the sitemap file. */
    link?: { label: string; url: string };
    /** The item could not be produced; the text says why. */
    problem?: boolean;
}

const FORMAT_NAMES: Record<string, string> = {
    "image/webp": "WebP",
    "image/png": "PNG",
    "image/svg+xml": "SVG",
    "image/gif": "GIF",
    "image/jpeg": "JPEG",
    "image/avif": "AVIF"
};

const formatName = (type: string): string =>
    FORMAT_NAMES[type] ?? (type.split("/")[1] ?? type).toUpperCase();

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const size = (bytes: number): string =>
    bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * The Site step's account of what a publish produced, in the approved wording.
 *
 * Each line says what the pipeline did, not what the result is: "carried over", "generated", "kept in
 * the format the source site served". Nothing here is a check, so nothing claims a quality. Images is
 * not "optimisation": the pipeline compresses nothing, and the formats are the source site's.
 *
 * Before the first publish only the sitemap has something to say: it does not exist yet.
 */
export const siteQualityLines = (
    qualities: SiteQualitiesDto | undefined,
    published: boolean
): QualityLine[] => {
    if (!published || !qualities) {
        return published
            ? []
            : [{ key: "sitemap", text: "Sitemap: generated when the site is published." }];
    }
    const lines: QualityLine[] = [];
    const { sitemap, images, seo } = qualities;
    if (sitemap) {
        lines.push(
            "error" in sitemap
                ? { key: "sitemap", text: `Sitemap not generated: ${sitemap.error}`, problem: true }
                : {
                      key: "sitemap",
                      text: `Sitemap generated: ${plural(sitemap.pages, "page")}.`,
                      link: { label: "View sitemap", url: sitemap.url }
                  }
        );
    }
    if (images) {
        lines.push({
            key: "images",
            text:
                images.files === 0
                    ? "Images: none in this site."
                    : `Images: ${plural(images.files, "file")}, ${size(images.bytes)} (${images.byType
                          .map(entry => `${entry.files} ${formatName(entry.type)}`)
                          .join(", ")}), kept in the format the source site served.`
        });
    }
    if (seo) {
        lines.push({
            key: "seo",
            text: `Page titles and descriptions carried over from the source site: ${seo.carried} of ${plural(seo.pages, "page")}.`
        });
    }
    return lines;
};
