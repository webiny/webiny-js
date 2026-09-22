import type { Cluster } from "~/domain/artifacts.js";

/**
 * Does this cluster carry anything a component could be built from?
 *
 * A section with no text, no images and no destinations anywhere in it is a spacer or an empty
 * wrapper. Generate will still produce a component for it, the validators will pass — there is
 * nothing to preserve, conform to or bind — and it arrives in the library as something like "Empty
 * Container / Spacer", which is visible to the customer and makes the output look careless.
 *
 * Judged across every member rather than the representative alone, so a cluster whose exemplar
 * happens to be the bare one is not discarded while its siblings carry content.
 *
 * Deliberately narrow: this is "there is provably nothing here", not "this looks unimportant".
 * Measured across the five customer sites it matched one cluster in thirty-one — the spacer it was
 * written for — and nothing else.
 */
export const hasNothingToGenerate = (cluster: Cluster): boolean => {
    const digests = [cluster.digest, ...cluster.members.map(member => member.digest)].filter(
        digest => digest !== undefined
    );

    const texts = [
        ...(cluster.observedTexts ?? []),
        ...digests.flatMap(digest => digest.texts ?? [])
    ];
    if (texts.some(text => text.trim().length > 0)) {
        return false;
    }

    return digests.every(digest => (digest.imageCount ?? 0) === 0 && (digest.linkCount ?? 0) === 0);
};
