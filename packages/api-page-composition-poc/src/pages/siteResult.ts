import { carriesPass, QUALITY_PASSES } from "@webiny/api-component-extraction/domain/qualityPasses.js";
import { summariseImages, type ImagesSummary } from "~/features/site/siteQualities.js";

type Pass = keyof typeof QUALITY_PASSES;

/** How many of a set of components carried each generation pass, of how many. */
export interface PassCounts {
    components: number;
    /** Placed components that could not be matched to a generated record: counted, never applied. */
    unmatched: number;
    accessibility: number;
    performance: number;
    responsiveness: number;
}

export interface SiteResultPage {
    pageId: string;
    path: string;
    /** Whether the published page carries both an SEO title and a description. */
    seo: boolean;
    /** The image files this page's component inputs use, by stored format. */
    images: ImagesSummary;
    /** The page's distinct components and the passes they were generated with. */
    passes: PassCounts;
}

export interface SiteResult {
    pages: SiteResultPage[];
    /** Every image file in the site's File Manager. */
    images: ImagesSummary;
    seo: { pages: number; carried: number };
    /** Over the distinct components the published pages place, so it agrees with the page list. */
    passes: PassCounts;
}

export interface SiteResultSources {
    pages: Array<{
        id: string;
        status: string;
        properties: { path: string; seo?: { title?: unknown; description?: unknown } };
        elements: Record<string, unknown> | null | undefined;
        bindings: unknown;
    }>;
    /** The site tenant's Library. */
    components: Array<{ id: string; name: string }>;
    /** The site tenant's File Manager. */
    files: Array<{ key: string; type: string; size: number }>;
    /** The run's generated components: what each one's prompt carried. */
    generated: Array<{ signature: string; name: string; qualityInstructions?: string[] }>;
    /** Library id → signature, from the run's approval into this tenant and the site record's map. */
    signatureById: ReadonlyMap<string, string>;
}

const PASSES: Pass[] = ["accessibility", "performance", "responsiveness"];

const placedNames = (elements: Record<string, unknown> | null | undefined): string[] => [
    ...new Set(
        Object.values(elements ?? {}).flatMap(element => {
            const name = (element as { component?: { name?: unknown } } | null)?.component?.name;
            return typeof name === "string" && !name.startsWith("Webiny/") ? [name] : [];
        })
    )
];

/** Every File Manager URL in a page's bindings, as the file key after `/files/`. */
const fileKeys = (value: unknown, out: Set<string> = new Set()): Set<string> => {
    if (typeof value === "string") {
        const at = value.indexOf("/files/");
        if (value.startsWith("http") && at >= 0) {
            out.add(decodeURIComponent(value.slice(at + "/files/".length)));
        }
    } else if (Array.isArray(value)) {
        value.forEach(item => fileKeys(item, out));
    } else if (value && typeof value === "object") {
        Object.values(value).forEach(item => fileKeys(item, out));
    }
    return out;
};

/** "Site/Feature Highlights (2)" → "Feature Highlights": the generated name a site copy carries. */
const baseName = (name: string): string => {
    const slash = name.indexOf("/");
    return (slash >= 0 ? name.slice(slash + 1) : name).replace(/\s\(\d+\)$/, "");
};

const seoCarried = (page: SiteResultSources["pages"][number]): boolean => {
    const seo = page.properties.seo;
    return (
        typeof seo?.title === "string" &&
        seo.title.trim() !== "" &&
        typeof seo.description === "string" &&
        seo.description.trim() !== ""
    );
};

/**
 * What the Site step shows as the result, site-wide and per page, from what the site holds now.
 *
 * Per-page facts are derived from per-run records, never measured per page: a page's accessibility
 * line is the share of its components whose generated record says the pass was in their prompt.
 *
 * A placed component is matched to its generated record by Library id first (the approval into this
 * tenant, or the site record's signature map), then, for sites built before either existed, by its
 * name without the site prefix and keep-both suffix, only where exactly one generated component has
 * that name. One that matches neither is counted on its page and never as applied.
 */
export const siteResult = (sources: SiteResultSources): SiteResult => {
    const idByName = new Map(sources.components.map(component => [component.name, component.id]));
    const bySignature = new Map(sources.generated.map(record => [record.signature, record]));
    const byName = new Map<string, SiteResultSources["generated"][number] | null>();
    for (const record of sources.generated) {
        // Two generated components with one name cannot be told apart by it.
        byName.set(record.name, byName.has(record.name) ? null : record);
    }
    const recordOf = (placed: string) => {
        const id = idByName.get(placed);
        const signature = id ? sources.signatureById.get(id) : undefined;
        if (signature && bySignature.has(signature)) {
            return bySignature.get(signature)!;
        }
        return byName.get(baseName(placed)) ?? null;
    };
    const count = (names: string[]): PassCounts => {
        const records = names.map(recordOf);
        const counts: PassCounts = {
            components: names.length,
            unmatched: records.filter(record => record === null).length,
            accessibility: 0,
            performance: 0,
            responsiveness: 0
        };
        for (const pass of PASSES) {
            counts[pass] = records.filter(
                record => record !== null && carriesPass(record.qualityInstructions, pass)
            ).length;
        }
        return counts;
    };

    const fileByKey = new Map(sources.files.map(file => [file.key, file]));
    const published = sources.pages
        .filter(page => page.status === "published")
        .sort((a, b) => a.properties.path.localeCompare(b.properties.path));

    const pages = published.map(page => {
        const files = [...fileKeys(page.bindings)].flatMap(key => {
            const file = fileByKey.get(key);
            return file ? [{ fileId: key, contentType: file.type, size: file.size }] : [];
        });
        return {
            pageId: page.id,
            path: page.properties.path,
            seo: seoCarried(page),
            images: summariseImages(files),
            passes: count(placedNames(page.elements))
        };
    });

    return {
        pages,
        images: summariseImages(
            sources.files
                .filter(file => file.type.startsWith("image/"))
                .map(file => ({ fileId: file.key, contentType: file.type, size: file.size }))
        ),
        seo: { pages: pages.length, carried: pages.filter(page => page.seo).length },
        passes: count([...new Set(published.flatMap(page => placedNames(page.elements)))])
    };
};
