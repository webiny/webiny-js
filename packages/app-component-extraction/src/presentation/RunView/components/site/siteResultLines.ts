import type { ImagesSummaryDto, PassCountsDto, SiteResultDto } from "~/shared/types.js";

/**
 * The Site step's result, in the approved wording (site-qualities-scoping.md,
 * site-step-as-result-scoping.md).
 *
 * Every line says what the pipeline did, not what the output is. A pass nothing checks carries a beta
 * label. A line is never hidden because the answer is zero: a missing line reads as a missing
 * feature, and the site summary must agree with the page list, so zero is said, with why.
 */
export interface QualityLine {
    key: "sitemap" | "images" | "seo" | "accessibility" | "performance" | "responsiveness";
    text: string;
    /** Something to open: the sitemap file. */
    link?: { label: string; url: string };
    /** The item could not be produced, or was not; the text says why. */
    muted?: boolean;
    /** Work the pipeline did that nothing checks yet. */
    beta?: boolean;
    /** A caveat worth a tooltip. */
    note?: string;
}

export type Pass = "accessibility" | "performance" | "responsiveness";

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

/** "43 WebP, 2 PNG, 2 SVG, 1 GIF". */
export const formats = (images: ImagesSummaryDto): string =>
    images.byType.map(entry => `${entry.files} ${formatName(entry.type)}`).join(", ");

/** What each pass did, as the approved wording names it. */
export const PASS_WHAT: Record<Pass, string> = {
    accessibility:
        "semantic elements, alt text from the source site, form labels, heading levels. Not checked against WCAG.",
    performance: "image dimensions set.",
    responsiveness: "fluid widths, no sideways scrolling, stacking at narrow widths, tap targets."
};

export const PASS_LABEL: Record<Pass, string> = {
    accessibility: "Accessibility pass",
    performance: "Performance pass",
    responsiveness: "Responsiveness pass"
};

/** Responsiveness has no capture behind it; said wherever it is shown. */
export const RESPONSIVENESS_NOTE =
    "Generic: the instruction asks for this behaviour. No mobile capture of the source stands behind it.";

const unmatchedNote = (counts: PassCountsDto): string | undefined =>
    counts.unmatched > 0
        ? `${plural(counts.unmatched, "component")} could not be matched to its generated record and ${counts.unmatched === 1 ? "is" : "are"} counted as not applied.`
        : undefined;

const passLine = (pass: Pass, counts: PassCountsDto, scope: "site" | "page"): QualityLine => {
    const applied = counts[pass];
    const note = [pass === "responsiveness" ? RESPONSIVENESS_NOTE : undefined, unmatchedNote(counts)]
        .filter(Boolean)
        .join(" ");
    const base = { key: pass, beta: true, ...(note ? { note } : {}) } as const;
    if (applied === 0) {
        return {
            ...base,
            muted: true,
            text: `${PASS_LABEL[pass]}: not applied. This ${scope}'s components were generated before it existed.`
        };
    }
    const where =
        applied === counts.components
            ? "applied in generation"
            : `applied in generation to ${applied} of ${plural(counts.components, "component")}`;
    return { ...base, text: `${PASS_LABEL[pass]} ${where}: ${PASS_WHAT[pass]}` };
};

/**
 * The site-wide result. Before the first publish there is only one thing to say: the sitemap comes
 * with it.
 */
export const siteWideLines = (result: SiteResultDto | null): QualityLine[] => {
    if (!result) {
        return [
            { key: "sitemap", text: "Sitemap: generated when the site is published.", muted: true }
        ];
    }
    const lines: QualityLine[] = [];
    const sitemap = result.sitemap;
    if (!sitemap) {
        lines.push({
            key: "sitemap",
            muted: true,
            text: "Sitemap: not generated. Published before this was added. Publishing again generates it."
        });
    } else if ("error" in sitemap) {
        lines.push({ key: "sitemap", muted: true, text: `Sitemap not generated: ${sitemap.error}` });
    } else if (!sitemap.domain) {
        // Written before the sitemap listed the site's own domain: its entries are preview addresses.
        lines.push({
            key: "sitemap",
            muted: true,
            text: "Sitemap: lists preview addresses, not the site's own domain. Publishing again regenerates it.",
            link: { label: "View sitemap", url: sitemap.url }
        });
    } else {
        lines.push({
            key: "sitemap",
            text: `Sitemap for ${sitemap.domain}: ${plural(sitemap.pages, "page")}, live once the domain points at this site.`,
            link: { label: "View sitemap", url: sitemap.url }
        });
    }
    lines.push({
        key: "images",
        text:
            result.images.files === 0
                ? "Images: none in this site."
                : `Images: ${plural(result.images.files, "file")}, ${size(result.images.bytes)} (${formats(result.images)}), kept in the format the source site served.`
    });
    lines.push(
        result.seo.carried === 0 && result.seo.pages > 0
            ? {
                  key: "seo",
                  muted: true,
                  text: "Page titles and descriptions: not carried over. Published before this was added. Publishing again carries them."
              }
            : {
                  key: "seo",
                  text: `Page titles and descriptions carried over from the source site: ${result.seo.carried} of ${plural(result.seo.pages, "page")}.`
              }
    );
    lines.push(
        passLine("accessibility", result.passes, "site"),
        passLine("performance", result.passes, "site"),
        passLine("responsiveness", result.passes, "site")
    );
    return lines;
};

/** One page's cells in the page list: short, with the full sentence for a tooltip. */
export interface Cell {
    label: string;
    full: string;
    muted: boolean;
}

export interface PageCells {
    seo: Cell;
    images: Cell;
    passes: Record<Pass, Cell>;
}

export const pageCells = (page: SiteResultDto["pages"][number]): PageCells => {
    const pass = (key: Pass): Cell => {
        const applied = page.passes[key];
        return {
            label: `${applied} of ${page.passes.components}`,
            full:
                applied === 0
                    ? passLine(key, page.passes, "page").text
                    : `${PASS_LABEL[key]} applied to ${applied} of ${plural(page.passes.components, "component")} on this page.`,
            muted: applied === 0
        };
    };
    return {
        seo: page.seo
            ? { label: "Carried over", full: "Title and description carried over.", muted: false }
            : {
                  label: "Not carried over",
                  full: "Not carried over: published before this was added. Publishing again carries them.",
                  muted: true
              },
        images:
            page.images.files === 0
                ? { label: "None", full: "No images in this page's components.", muted: true }
                : {
                      label: `${page.images.files} · ${formats(page.images)}`,
                      full: `${plural(page.images.files, "image")} in this page's components: ${formats(page.images)}. Pictures a component's CSS or code holds outside its inputs are not counted.`,
                      muted: false
                  },
        passes: {
            accessibility: pass("accessibility"),
            performance: pass("performance"),
            responsiveness: pass("responsiveness")
        }
    };
};
