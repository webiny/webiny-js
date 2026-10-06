import type { Cluster } from "~/domain/artifacts.js";
import { referenceMemberOf } from "~/domain/referenceCrop.js";

/**
 * The text of the member the reference image shows, in document order.
 *
 * Usually the representative. When the representative's crop was missing and another member's picture
 * stands in for it, the text follows the picture: the model is told to reproduce the section in the
 * image and to preserve this text, and the two have to describe one section.
 *
 * Falls back to the cluster union when that member has no digest texts — a section whose text all
 * sits on descendants the digest did not record. Emitting nothing there would tell the model to
 * reproduce a picture with no text at all, which is a worse instruction than the one being replaced.
 */
export const referenceTexts = (
    cluster: Pick<Cluster, "representative" | "representativeCrop" | "members" | "observedTexts">
): string[] => {
    const member =
        referenceMemberOf(cluster.representativeCrop, cluster.members) ?? cluster.representative;
    const texts = (member.digest?.texts ?? []).filter(
        (text): text is string => typeof text === "string"
    );
    return texts.length > 0 ? texts : cluster.observedTexts;
};
