/**
 * Which revision is live, told apart from which revision is being read.
 *
 * Only `published` is coloured. The CMS marks the published revision the same way — an accent icon
 * and "This revision is currently published!" — because it is the one status with a consequence
 * outside the editor: that revision is what the public sees. A draft is the default state of a
 * revision and reads as one.
 *
 * Green rather than the brand accent, which the "Current" tag beside it already uses. The two
 * answer different questions — which revision is live, and which one you are looking at — and are
 * routinely not the same revision.
 */
/**
 * How a revision's publishing status reads in the band.
 *
 * `CmsEntryStatus` is exactly three values — `published`, `unpublished`, `draft` — so this covers
 * the set rather than guessing at it, and the fallback is for a status the CMS adds later.
 *
 * The three are deliberately three different weights. `published` is the only one that says
 * something is live, so it is the only filled colour. `unpublished` is a decision someone made —
 * this was live and was taken down — which a filled neutral states without alarming anyone;
 * `warning` would read as a fault, and it is not one. `draft` keeps the outline it had, because
 * "not yet" should be the quietest of the three.
 *
 * `unpublished` previously fell through to the draft outline, which made a deliberate takedown
 * indistinguishable from something never published.
 */
export const STATUS_TAG_VARIANT: Record<
    string,
    "success-light" | "neutral-muted" | "neutral-base-outline"
> = {
    published: "success-light",
    unpublished: "neutral-muted",
    draft: "neutral-base-outline"
};
