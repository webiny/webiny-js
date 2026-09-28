import { createHash } from "node:crypto";

/**
 * What happened to one image the page loaded.
 *
 * Deliberately the same three-way shape as `DestinationOutcome` in the composition PoC — migrated,
 * left alone, flagged — because it answers the same question about a different kind of reference, and
 * two structures answering one question is the pattern that has produced most of this project's bugs.
 *
 * `deduplicated` is a fourth arm rather than a variant of `migrated` so the report can tell an upload
 * from a reuse; both end with a usable Webiny URL, so a consumer that only wants the destination can
 * treat them together.
 */
export type AssetOutcome =
    /** Downloaded and stored in File Manager for the first time. */
    | {
          kind: "migrated";
          sourceUrl: string;
          fileId: string;
          url: string;
          sha256: string;
          bytes: number;
      }
    /** Already in File Manager. `by` says which check found it, which is what proves dedup works. */
    | {
          kind: "deduplicated";
          sourceUrl: string;
          fileId: string;
          url: string;
          sha256: string;
          by: "url" | "content";
      }
    /** Belongs to a third-party service the migration does not reproduce. Left pointing where it was. */
    | { kind: "external"; sourceUrl: string; reason: string }
    /** Could not be migrated. Left pointing where it was, and recorded — never silently. */
    | { kind: "unmigrated"; sourceUrl: string; reason: string };

/** A file in File Manager that an image's bytes were stored as. */
export interface MigratedAsset {
    fileId: string;
    /** The File Manager key, which is what a renderable URL is built from. */
    fileKey: string;
    contentType: string;
    size: number;
    /**
     * The URL these bytes were first seen at.
     *
     * Kept so a later re-upload can be recognised as the same image rather than a new one. The hash is
     * over the bytes the BROWSER received, and a CDN serving `f_auto` hands the browser whichever
     * format it negotiates — so a Chromium upgrade that starts preferring AVIF over WebP changes every
     * hash and would otherwise look like a site full of new images. Matching on this URL is what says
     * "same picture, re-encoded" instead.
     */
    sourceUrl: string;
    migratedOn: string;
}

/**
 * Keys in the tenant KeyValueStore.
 *
 * One key per entry rather than one key holding a map, for two reasons this project has already paid
 * for. A single aggregate is the shape that broke the Generate artifact against DynamoDB's 400 KB item
 * limit, and it would fail the same way here once a portfolio's worth of images accumulated. And
 * capture pages complete in parallel, so one map means read-modify-write races that silently drop
 * entries; per-key writes have no such interaction.
 */
const PREFIX = "componentExtraction:asset";

/** The content hash is the identity: same bytes, same asset, whatever URL served them. */
export const assetKey = (sha256: string): string => `${PREFIX}:sha:${sha256}`;

/**
 * A URL pointer, so a repeated URL skips the download entirely. The URL is hashed rather than used
 * raw: a Cloudinary transformation URL runs to several hundred characters and carries characters a
 * key should not have to survive.
 */
export const assetUrlKey = (url: string): string =>
    `${PREFIX}:url:${createHash("sha256").update(url).digest("hex")}`;

/** The counts a run reports, in the shape the page map already reports links. */
export interface AssetTally {
    migrated: number;
    deduplicated: number;
    external: number;
    unmigrated: number;
    /**
     * Why images were left alone or could not be migrated, counted by reason.
     *
     * Counts rather than a list, so this stays bounded however many images a site has — the per-image
     * detail is in the outcomes blob. It is here because a bare "25 unmigrated" is not actionable:
     * whether those are tracking pixels or a quarter of the photography is the whole question, and
     * the operator reads this artifact.
     */
    reasons: Record<string, number>;
}

/**
 * The reason, without its per-image detail.
 *
 * `"unreadable: No data found for resource"` and `"unreadable: Target closed"` are one reason with
 * two stories; grouping on the part before the colon keeps the histogram to a handful of keys rather
 * than one key per image.
 */
const reasonKey = (reason: string): string => reason.split(":")[0].trim().slice(0, 60);

export const tallyAssets = (outcomes: AssetOutcome[]): AssetTally => {
    const reasons: Record<string, number> = {};
    for (const outcome of outcomes) {
        if (outcome.kind === "external" || outcome.kind === "unmigrated") {
            const key = `${outcome.kind}: ${reasonKey(outcome.reason)}`;
            reasons[key] = (reasons[key] ?? 0) + 1;
        }
    }

    return {
        migrated: outcomes.filter(outcome => outcome.kind === "migrated").length,
        deduplicated: outcomes.filter(outcome => outcome.kind === "deduplicated").length,
        external: outcomes.filter(outcome => outcome.kind === "external").length,
        unmigrated: outcomes.filter(outcome => outcome.kind === "unmigrated").length,
        reasons
    };
};
