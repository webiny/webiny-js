import type { CapturedNode, PlannedComponent, SegmentArtifact } from "~/domain/artifacts.js";
import type { StageLedgerEntry } from "~/domain/types.js";
import type { BlobStore, StageArtifactStore } from "~/domain/stage.js";
import { stageEntry } from "~/domain/ledger.js";
import { findNodeByBox } from "~/features/stages/cluster/sectionNode.js";

/**
 * The representative member's captured section, read the way Plan reads it: the run's segment artifact
 * for the page's tree, then the node at the section's box.
 *
 * For what is measured from the section when a prompt is built rather than when it is planned, so a
 * plan made before the measurement existed gets it too (the lesson of #2, whose tags only new plans
 * carried). Null when any step is missing; the prompt then goes without it, as before.
 */
export const loadRepresentativeNode = async (
    deps: { store: StageArtifactStore.Interface; blobs: BlobStore.Interface },
    stages: StageLedgerEntry[],
    planned: Pick<PlannedComponent, "representative">
): Promise<CapturedNode | null> => {
    const segmentRef = stageEntry(stages, "segment")?.artifacts?.sections;
    if (!segmentRef || !planned.representative) {
        return null;
    }
    const segment = await deps.store.getJson<SegmentArtifact>(segmentRef);
    if (segment.isFail() || !segment.value) {
        return null;
    }
    const page = segment.value.pages.find(
        candidate => candidate.url === planned.representative.url
    );
    const section = page?.sections.find(
        candidate => candidate.index === planned.representative.sectionIndex
    );
    if (!page || !section) {
        return null;
    }
    const blob = await deps.blobs.get(page.treeRef);
    if (blob.isFail()) {
        return null;
    }
    try {
        const tree = JSON.parse(new TextDecoder().decode(blob.value)) as CapturedNode;
        return findNodeByBox(tree, section.box);
    } catch {
        return null;
    }
};
