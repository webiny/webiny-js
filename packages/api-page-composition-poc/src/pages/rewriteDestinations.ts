import { toPageIdentity } from "~/pages/toPageIdentity.js";

/** What happened to one destination. Every destination gets exactly one of these. */
export type DestinationOutcome =
    /** Pointed at a page in this migration, and now points at its Webiny path. */
    | { kind: "rewritten"; elementId: string; path: string; from: string; to: string }
    /** Another host: left exactly as it was. */
    | { kind: "external"; elementId: string; path: string; href: string }
    /** This site, but a page the migration does not contain. Left absolute, and flagged. */
    | { kind: "unmigrated"; elementId: string; path: string; href: string };

export interface RewriteResult {
    bindings: Record<string, any>;
    outcomes: DestinationOutcome[];
}

/** Which input paths name a destination. Shared, so the strip and the rewrite cannot disagree. */
export const isDestinationPath = (path: string): boolean => /(^|\/)(url|href|link|to)$/i.test(path);

/**
 * Where a same-host destination would have been migrated to.
 *
 * Deliberately the SAME function that named the pages, so matching cannot drift from path
 * derivation: `toPageIdentity` already folds away trailing slashes, `index.html`, page extensions,
 * query strings and fragments, which is exactly the normalisation the brief asks for, and it does it
 * once rather than twice with two chances to disagree.
 */
const intendedPath = (href: string): string => toPageIdentity(href).path;

/**
 * Rewrite the destinations on one page's bindings.
 *
 * The three-way rule: a destination pointing at a page in this migration becomes that page's path; a
 * destination on another host is untouched; a destination on THIS site that the migration does not
 * contain stays absolute and is flagged, because a relative link to a page that was never created
 * would 404 while the absolute one still works against the live site.
 *
 * Note this asks a different question from the credibility rule that prunes generated defaults, and
 * the two must not be confused. Credibility asks "does this resolve anywhere at all?", which is why
 * an absolute URL on another host passes it. Rewriting asks "is this one of the pages we just
 * created?", and for a same-host captured URL the answer is a genuine three-way split. The same URL
 * can be credible and unmigrated at once: that is not a contradiction, it is the correct reading of
 * both rules.
 */
export const rewriteDestinations = (params: {
    bindings: Record<string, any>;
    /** Paths of the pages actually created, as `toPageIdentity` derived them. */
    migratedPaths: ReadonlySet<string>;
    sourceHost: string;
}): RewriteResult => {
    const { bindings, migratedPaths, sourceHost } = params;
    const outcomes: DestinationOutcome[] = [];

    /** The three-way rule for one destination, as applied to link inputs below. */
    const classify = (elementId: string, path: string, href: string): DestinationOutcome => {
        try {
            const url = new URL(href, `https://${sourceHost}`);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return { kind: "external", elementId, path, href };
            }
            if (url.host !== sourceHost) {
                return { kind: "external", elementId, path, href };
            }
        } catch {
            return { kind: "external", elementId, path, href };
        }
        const target = intendedPath(href);
        return migratedPaths.has(target)
            ? { kind: "rewritten", elementId, path, from: href, to: target }
            : { kind: "unmigrated", elementId, path, href };
    };
    const rewritten: Record<string, any> = {};

    for (const [elementId, element] of Object.entries(bindings)) {
        const inputs = (element as { inputs?: Record<string, any> })?.inputs;
        if (!inputs) {
            rewritten[elementId] = element;
            continue;
        }

        const nextInputs: Record<string, any> = {};

        for (const [path, binding] of Object.entries(inputs)) {
            const href = (binding as { static?: unknown })?.static;

            /*
             * A rich text value can carry links inside its HTML: the inline links composition puts back
             * into their paragraph (lexicalHtml.ts). They get the same three-way rule as a link input,
             * each recorded as its own destination.
             */
            if (
                (binding as { type?: string })?.type === "lexical" &&
                typeof href === "string" &&
                /href="/.test(href)
            ) {
                const html = href.replace(/href="([^"]*)"/g, (whole, raw: string) => {
                    const target = raw.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
                    const outcome = classify(elementId, `${path}#href`, target);
                    outcomes.push(outcome);
                    return outcome.kind === "rewritten" ? `href="${outcome.to}"` : whole;
                });
                nextInputs[path] = { ...(binding as object), static: html };
                continue;
            }

            if (!isDestinationPath(path) || typeof href !== "string" || !href.trim()) {
                nextInputs[path] = binding;
                continue;
            }

            let host: string;
            try {
                const url = new URL(href, `https://${sourceHost}`);
                if (url.protocol !== "http:" && url.protocol !== "https:") {
                    // `mailto:`, `tel:` — not a page reference at all.
                    outcomes.push({ kind: "external", elementId, path, href });
                    nextInputs[path] = binding;
                    continue;
                }
                host = url.host;
            } catch {
                outcomes.push({ kind: "external", elementId, path, href });
                nextInputs[path] = binding;
                continue;
            }

            if (host !== sourceHost) {
                outcomes.push({ kind: "external", elementId, path, href });
                nextInputs[path] = binding;
                continue;
            }

            const target = intendedPath(href);
            if (migratedPaths.has(target)) {
                outcomes.push({ kind: "rewritten", elementId, path, from: href, to: target });
                nextInputs[path] = { ...(binding as object), static: target };
                continue;
            }

            outcomes.push({ kind: "unmigrated", elementId, path, href });
            nextInputs[path] = binding;
        }

        rewritten[elementId] = { ...(element as object), inputs: nextInputs };
    }

    return { bindings: rewritten, outcomes };
};

/** The reconciliation the run is checked against: every destination lands in exactly one bucket. */
export interface RewriteTally {
    destinations: number;
    rewritten: number;
    external: number;
    unmigrated: number;
}

export const tally = (outcomes: readonly DestinationOutcome[]): RewriteTally => ({
    destinations: outcomes.length,
    rewritten: outcomes.filter(o => o.kind === "rewritten").length,
    external: outcomes.filter(o => o.kind === "external").length,
    unmigrated: outcomes.filter(o => o.kind === "unmigrated").length
});
