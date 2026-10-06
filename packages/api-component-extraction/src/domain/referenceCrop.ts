import type { ClusterMember, RepresentativeCrop } from "./artifacts.js";

/**
 * Which member's crop a cluster's component is generated from.
 *
 * The representative's, when it has a whole one. Otherwise the first member that does — members share
 * a layout, which is what put them in one cluster, so another member's picture shows the same
 * component — and failing that the first member with a partial crop. When no member has any crop the
 * representative is kept with an empty `cropRef`, and Generate records the component as not generated
 * rather than asking a model to reproduce a picture it does not have.
 *
 * The representative itself does not change: it carries the cluster's identity (its signature is what
 * corrections reattach by), and only the picture moves.
 */
export const chooseReferenceCrop = (members: ClusterMember[]): RepresentativeCrop => {
    const whole = members.find(member => member.cropRef && !member.cropWarning);
    const partial = members.find(member => member.cropRef);
    const chosen = whole ?? partial ?? members[0];

    return {
        screenshotRef: chosen?.screenshotRef ?? "",
        box: chosen?.box ?? { x: 0, y: 0, width: 0, height: 0 },
        cropRef: chosen?.cropRef ?? "",
        ...(chosen ? { member: { url: chosen.url, sectionIndex: chosen.sectionIndex } } : {}),
        ...(chosen?.cropScale ? { cropScale: chosen.cropScale } : {})
    };
};

/**
 * The member a reference crop came from, or undefined when the crop names none (an artifact written
 * before this was recorded) or that member is no longer in the list.
 */
export const referenceMemberOf = (
    crop: RepresentativeCrop,
    members: ClusterMember[]
): ClusterMember | undefined => {
    const source = crop.member;
    if (!source) {
        return undefined;
    }
    return members.find(
        member => member.url === source.url && member.sectionIndex === source.sectionIndex
    );
};
