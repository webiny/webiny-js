import type { ImagesSummaryDto, PassCountsDto, SiteResultDto } from "~/shared/types.js";

/**
 * The Site step's result as the redesigned screen reads it (site-step-as-result-scoping.md, the
 * 2026-10-12 design pass).
 *
 * Every item says what the pipeline did, not what the output is. Shorter than the first wording, never
 * stronger. A quality not on the site says so, with what changes it, and only the facts promise to
 * arrive at the next publish: the passes are added when components are generated, so publishing again
 * does not bring them.
 */
export type Pass = "accessibility" | "performance" | "responsiveness";

export type QualityKey = "sitemap" | "images" | "seo" | Pass;

export interface QualityItem {
    key: QualityKey;
    label: string;
    done: boolean;
    /** The state in a few words: "Generated", "48 files", "Arrives when you publish again". */
    state: string;
    /** What it is, or why it is not yet. */
    detail?: string;
    /** What changes a not-yet state. */
    action?: string;
    /** A qualifier that must stay with the item: shown on the card itself. */
    qualifier?: string;
    /** A caveat for a tooltip. */
    note?: string;
    link?: { label: string; url: string };
    /** Not yet, and publishing again brings it. */
    arrivesOnPublish?: boolean;
}

export interface QualityGroups {
    facts: QualityItem[];
    passes: QualityItem[];
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

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const size = (bytes: number): string =>
    bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** "43 WebP, 2 PNG, 2 SVG, 1 GIF". */
export const formats = (images: ImagesSummaryDto): string =>
    images.byType.map(entry => `${entry.files} ${formatName(entry.type)}`).join(", ");

export const PASS_LABEL: Record<Pass, string> = {
    accessibility: "Accessibility pass",
    performance: "Performance pass",
    responsiveness: "Responsiveness pass"
};

/** What each pass asks of a component, as the approved wording names it. */
const PASS_WHAT: Record<Pass, string> = {
    accessibility: "Semantic elements, alt text from the source site, form labels, heading levels.",
    performance: "Image dimensions set.",
    responsiveness: "Fluid widths, no sideways scrolling, stacking at narrow widths, tap targets."
};

/** Responsiveness has no capture behind it; said wherever it is shown. */
export const RESPONSIVENESS_NOTE =
    "Generic: the instruction asks for this behaviour. No mobile capture of the source stands behind it.";

/** Nothing verifies the output, and the customer's own sites carry a WCAG badge: said on the card. */
export const WCAG_QUALIFIER = "Not checked against WCAG.";

export const PASS_NOT_YET = "The components were generated before this pass existed.";
export const PASS_ACTION = "Regenerating the components with its instruction on adds it.";
/** The same two sentences, once for all three passes. */
export const PASSES_NOT_YET = "The components were generated before these passes existed.";
export const PASSES_ACTION = "Regenerating the components with their instructions on adds them.";

const ARRIVES = "Arrives when you publish again";

const unmatchedNote = (counts: PassCountsDto): string | undefined =>
    counts.unmatched > 0
        ? `${plural(counts.unmatched, "component")} could not be matched to its generated record and ${counts.unmatched === 1 ? "is" : "are"} counted as not applied.`
        : undefined;

const passItem = (pass: Pass, counts: PassCountsDto): QualityItem => {
    const applied = counts[pass];
    const note =
        [pass === "responsiveness" ? RESPONSIVENESS_NOTE : undefined, unmatchedNote(counts)]
            .filter(Boolean)
            .join(" ") || undefined;
    if (applied === 0) {
        return {
            key: pass,
            label: PASS_LABEL[pass],
            done: false,
            state: "Not yet",
            detail: PASS_NOT_YET,
            action: PASS_ACTION,
            ...(note ? { note } : {})
        };
    }
    return {
        key: pass,
        label: PASS_LABEL[pass],
        done: true,
        state: "Applied in generation",
        detail: `To ${applied} of ${plural(counts.components, "component")}. ${PASS_WHAT[pass]}`,
        ...(pass === "accessibility" ? { qualifier: WCAG_QUALIFIER } : {}),
        ...(note ? { note } : {})
    };
};

/** The six qualities, as facts counted from the published site and passes applied in generation. */
export const qualityGroups = (result: SiteResultDto): QualityGroups => {
    const facts: QualityItem[] = [];
    const sitemap = result.sitemap;
    if (!sitemap) {
        facts.push({
            key: "sitemap",
            label: "Sitemap",
            done: false,
            state: ARRIVES,
            detail: "Published before this was added.",
            arrivesOnPublish: true
        });
    } else if ("error" in sitemap) {
        facts.push({
            key: "sitemap",
            label: "Sitemap",
            done: false,
            state: "Not generated",
            detail: sitemap.error,
            action: "Publishing again tries again.",
            arrivesOnPublish: true
        });
    } else if (!sitemap.domain) {
        // Written before the sitemap listed the site's own domain: its entries are preview addresses.
        facts.push({
            key: "sitemap",
            label: "Sitemap",
            done: false,
            state: ARRIVES,
            detail: "The current one lists preview addresses, not the site's own domain.",
            link: { label: "View sitemap", url: sitemap.url },
            arrivesOnPublish: true
        });
    } else {
        facts.push({
            key: "sitemap",
            label: "Sitemap",
            done: true,
            state: "Generated",
            detail: `For ${sitemap.domain}: ${plural(sitemap.pages, "page")}, live once the domain points at this site.`,
            link: { label: "View sitemap", url: sitemap.url }
        });
    }
    facts.push(
        result.images.files === 0
            ? {
                  key: "images",
                  label: "Images",
                  done: true,
                  state: "None",
                  detail: "No images in this site."
              }
            : {
                  key: "images",
                  label: "Images",
                  done: true,
                  state: plural(result.images.files, "file"),
                  detail: `In the site's File Manager, ${size(result.images.bytes)} (${formats(result.images)}), kept in the format the source site served.`
              }
    );
    facts.push(
        result.seo.carried === 0 && result.seo.pages > 0
            ? {
                  key: "seo",
                  label: "Page titles and descriptions",
                  done: false,
                  state: ARRIVES,
                  detail: "Published before this was added.",
                  arrivesOnPublish: true
              }
            : {
                  key: "seo",
                  label: "Page titles and descriptions",
                  done: true,
                  state: "Carried over",
                  detail: `From the source site, on ${result.seo.carried} of ${plural(result.seo.pages, "page")}.`
              }
    );
    return {
        facts,
        passes: [
            passItem("accessibility", result.passes),
            passItem("performance", result.passes),
            passItem("responsiveness", result.passes)
        ]
    };
};

export interface QualitySummary {
    /** "2 of 6 on this site · 4 not yet". */
    text: string;
    /** Only the facts publishing again brings, with the prompt that names them; null when none. */
    publishPrompt: string | null;
}

export const qualitySummary = (groups: QualityGroups): QualitySummary => {
    const all = [...groups.facts, ...groups.passes];
    const done = all.filter(item => item.done).length;
    const notYet = all.length - done;
    const onPublish = groups.facts.filter(item => item.arrivesOnPublish).length;
    return {
        text:
            notYet === 0
                ? `${all.length} of ${all.length} on this site`
                : `${done} of ${all.length} on this site · ${notYet} not yet`,
        publishPrompt:
            onPublish === 0
                ? null
                : `Publishing again brings ${onPublish === 1 ? "one of these" : `${onPublish} of these`}.`
    };
};

/** One page's cells in the page table: short, with the full sentence for a tooltip. */
export interface Cell {
    label: string;
    full: string;
    /** Not on this page yet: drawn as the not-yet tag, not as a value. */
    notYet: boolean;
}

export interface PageCells {
    seo: Cell;
    images: Cell;
    passes: Record<Pass, Cell>;
}

export const PASSES: Pass[] = ["accessibility", "performance", "responsiveness"];

export const pageCells = (page: SiteResultDto["pages"][number]): PageCells => {
    const pass = (key: Pass): Cell => {
        const applied = page.passes[key];
        return applied === 0
            ? {
                  label: "Not yet",
                  full: `${PASS_LABEL[key]}: not yet. ${PASS_NOT_YET} ${PASS_ACTION}`,
                  notYet: true
              }
            : {
                  label: `${applied} of ${page.passes.components}`,
                  full: `${PASS_LABEL[key]} applied in generation to ${applied} of ${plural(page.passes.components, "component")} on this page.`,
                  notYet: false
              };
    };
    return {
        seo: page.seo
            ? { label: "Carried over", full: "Title and description carried over.", notYet: false }
            : {
                  label: "Not yet",
                  full: "Not yet: published before this was added. Publishing again carries them.",
                  notYet: true
              },
        images:
            page.images.files === 0
                ? { label: "None", full: "No images in this page's components.", notYet: false }
                : {
                      label: `${page.images.files} (${formats(page.images)})`,
                      full: `${plural(page.images.files, "image")} this page's components use: ${formats(page.images)}. An image two pages share counts on each. Pictures a component's CSS or code holds outside its inputs are not counted.`,
                      notYet: false
                  },
        passes: {
            accessibility: pass("accessibility"),
            performance: pass("performance"),
            responsiveness: pass("responsiveness")
        }
    };
};

/**
 * Which columns read "not yet" on every page, so the table can say it once instead of on every row.
 * Thirty identical tags read as missing data, as a dash did.
 */
export const siteWideNotYet = (
    result: SiteResultDto
): { seo: boolean; passes: Record<Pass, boolean>; allPasses: boolean } => {
    const any = result.pages.length > 0;
    const passes = Object.fromEntries(
        PASSES.map(key => [key, any && result.pages.every(page => page.passes[key] === 0)])
    ) as Record<Pass, boolean>;
    return {
        seo: any && result.pages.every(page => !page.seo),
        passes,
        allPasses: PASSES.every(key => passes[key])
    };
};
