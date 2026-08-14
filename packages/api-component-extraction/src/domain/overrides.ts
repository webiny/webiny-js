import type { Stage } from "~/constants.js";
import type {
    Correction,
    CorrectionKind,
    Override,
    OverrideMode,
    Reattachment,
    ReattachStatus
} from "./types.js";
import type {
    CaptureArtifact,
    ClassifyArtifact,
    Cluster,
    ClusterArtifact,
    ClusterMember,
    DiscoverArtifact,
    DiscoveredUrl,
    PlanArtifact,
    SectionDigest,
    SegmentArtifact
} from "./artifacts.js";

/**
 * Pure application and reattachment of overrides onto a stage's machine output — the load-bearing part of
 * W8, kept pure and separate from storage so the signature-matching rules are unit-testable without a
 * database. Each `apply*` returns the EFFECTIVE artifact plus one `Reattachment` per override: `applied`,
 * `not-applicable` (its target is absent this run) or `conflicting`. Overrides are matched by structural
 * signature (or normalised URL), never by array position, so a correction survives re-running the stage.
 */

const MAX_OBSERVED_TEXTS = 60;

export interface ApplyResult<A> {
    effective: A;
    reattachments: Reattachment[];
}

/** An override changes a stage's output in place, except the cluster threshold which changes its input. */
export const overrideMode = (kind: CorrectionKind): OverrideMode =>
    kind === "cluster.threshold" ? "parameter" : "artifact";

/** A page's normalised URL — the key page-level overrides (exclude, discover edits) attach to. */
export const normalizeUrl = (url: string): string => {
    try {
        const parsed = new URL(url);
        parsed.hash = "";
        parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
        return `${parsed.origin}${parsed.pathname}${parsed.search}`;
    } catch {
        return url.trim();
    }
};

export const overridesForStage = (overrides: Override[], stage: Stage): Override[] =>
    overrides.filter(override => override.stage === stage);

const reattachment = (
    override: Override,
    status: ReattachStatus,
    reason: string | null
): Reattachment => ({
    overrideId: override.id,
    stage: override.stage,
    signature: override.structuralSignature,
    kind: override.correction.kind,
    status,
    reason
});

const dedupeMembers = (members: ClusterMember[]): ClusterMember[] => {
    const seen = new Set<string>();
    const out: ClusterMember[] = [];
    for (const member of members) {
        const key = `${member.url}#${member.sectionIndex}`;
        if (!seen.has(key)) {
            seen.add(key);
            out.push(member);
        }
    }
    return out;
};

const emptyDigest = (): SectionDigest => ({
    structure: "",
    texts: [],
    imageCount: 0,
    linkCount: 0,
    headingCount: 0
});

/** Build a cluster from members broken away by a split — the first member becomes the representative. */
const clusterFromMembers = (members: ClusterMember[]): Cluster => {
    const representative = members[0];
    const texts = members.flatMap(member => member.digest?.texts ?? []);
    return {
        signature: representative.signature,
        members,
        representative,
        digest: representative.digest ?? emptyDigest(),
        observedTexts: [...new Set(texts)].slice(0, MAX_OBSERVED_TEXTS),
        representativeCrop: {
            screenshotRef: representative.screenshotRef ?? "",
            box: representative.box ?? { x: 0, y: 0, width: 0, height: 0 },
            cropRef: representative.cropRef
        }
    };
};

/** Combine merged clusters into one, choosing the representative and unioning members and observed text. */
const mergeClusters = (matched: Cluster[], pinnedSignature: string | undefined): Cluster => {
    const representative =
        (pinnedSignature &&
            matched.find(cluster => cluster.representative.signature === pinnedSignature)) ||
        [...matched].sort((a, b) => b.members.length - a.members.length)[0];
    const members = dedupeMembers(matched.flatMap(cluster => cluster.members));
    const observedTexts = [...new Set(matched.flatMap(cluster => cluster.observedTexts))].slice(
        0,
        MAX_OBSERVED_TEXTS
    );
    return { ...representative, members, observedTexts, excluded: false };
};

// `_kind` is unused at runtime — it exists so callers pass the literal that infers K for the narrowed type.
const asKind = <K extends CorrectionKind>(
    correction: Correction,
    _kind: K
): Extract<Correction, { kind: K }> => correction as Extract<Correction, { kind: K }>;

/**
 * Apply the Cluster stage's overrides. Order is deterministic — merge, split, move, exclude — so the
 * effective output does not depend on the order corrections were made.
 *
 * Matching rules (reported per the brief):
 *  - merge: whichever recorded representative signatures are present this run merge; FEWER THAN TWO
 *    present ⇒ not-applicable (nothing to merge), never conflicting.
 *  - split: any present recorded member signatures are pulled out into a new cluster; none present ⇒
 *    not-applicable.
 *  - move: member present + target present ⇒ move; member present, target absent ⇒ conflicting; member
 *    absent ⇒ not-applicable.
 *  - exclude: representative present ⇒ mark excluded; absent ⇒ not-applicable.
 */
export const applyClusterOverrides = (
    artifact: ClusterArtifact,
    overrides: Override[]
): ApplyResult<ClusterArtifact> => {
    let clusters: Cluster[] = artifact.clusters.map(cluster => ({
        ...cluster,
        members: [...cluster.members]
    }));
    const reattachments: Reattachment[] = [];
    const ofKind = (kind: CorrectionKind) =>
        overrides.filter(override => override.correction.kind === kind);

    for (const override of ofKind("cluster.merge")) {
        const correction = asKind(override.correction, "cluster.merge");
        const targets = new Set(correction.representativeSignatures);
        const matched = clusters.filter(
            cluster => targets.has(cluster.representative.signature) && !cluster.excluded
        );
        if (matched.length < 2) {
            reattachments.push(
                reattachment(
                    override,
                    "not-applicable",
                    `merge needs at least two of its clusters present; found ${matched.length}`
                )
            );
            continue;
        }
        const insertAt = clusters.indexOf(matched[0]);
        const merged = mergeClusters(matched, correction.representativeSignature);
        clusters = clusters.filter(cluster => !matched.includes(cluster));
        clusters.splice(Math.max(0, insertAt), 0, merged);
        reattachments.push(reattachment(override, "applied", null));
    }

    for (const override of ofKind("cluster.split")) {
        const correction = asKind(override.correction, "cluster.split");
        const targets = new Set(correction.memberSignatures);
        const pulled: ClusterMember[] = [];
        for (const cluster of clusters) {
            const staying = cluster.members.filter(member => !targets.has(member.signature));
            const leaving = cluster.members.filter(member => targets.has(member.signature));
            if (leaving.length > 0) {
                pulled.push(...leaving);
                cluster.members = staying;
            }
        }
        if (pulled.length === 0) {
            reattachments.push(
                reattachment(override, "not-applicable", "none of the split members are present")
            );
            continue;
        }
        clusters = clusters.filter(cluster => cluster.members.length > 0);
        clusters.push(clusterFromMembers(pulled));
        reattachments.push(reattachment(override, "applied", null));
    }

    for (const override of ofKind("cluster.move")) {
        const correction = asKind(override.correction, "cluster.move");
        const source = clusters.find(cluster =>
            cluster.members.some(member => member.signature === correction.memberSignature)
        );
        const target = clusters.find(
            cluster => cluster.representative.signature === correction.targetRepresentativeSignature
        );
        if (!source) {
            reattachments.push(
                reattachment(override, "not-applicable", "the moved member is absent this run")
            );
            continue;
        }
        if (!target) {
            reattachments.push(
                reattachment(override, "conflicting", "the move target cluster is absent this run")
            );
            continue;
        }
        if (source !== target) {
            const member = source.members.find(
                item => item.signature === correction.memberSignature
            )!;
            source.members = source.members.filter(item => item !== member);
            target.members.push(member);
        }
        reattachments.push(reattachment(override, "applied", null));
    }
    clusters = clusters.filter(cluster => cluster.members.length > 0);

    for (const override of ofKind("cluster.exclude")) {
        const target = clusters.find(
            cluster => cluster.representative.signature === override.structuralSignature
        );
        if (!target) {
            reattachments.push(
                reattachment(override, "not-applicable", "the excluded cluster is absent this run")
            );
            continue;
        }
        target.excluded = true;
        reattachments.push(reattachment(override, "applied", null));
    }

    return { effective: { clusters }, reattachments };
};

/** Apply Classify overrides: set a cluster's name and/or type, keyed by cluster signature. */
export const applyClassifyOverrides = (
    artifact: ClassifyArtifact,
    overrides: Override[]
): ApplyResult<ClassifyArtifact> => {
    const bySignature = new Map(
        overrides
            .filter(override => override.correction.kind === "classify.set")
            .map(override => [override.structuralSignature, override])
    );
    const reattachments: Reattachment[] = [];
    const present = new Set(artifact.clusters.map(entry => entry.cluster.signature));

    const clusters = artifact.clusters.map(entry => {
        const override = bySignature.get(entry.cluster.signature);
        if (!override) {
            return entry;
        }
        const correction = asKind(override.correction, "classify.set");
        reattachments.push(reattachment(override, "applied", null));
        return {
            ...entry,
            name: correction.name ?? entry.name,
            type: correction.type ?? entry.type,
            unclassified: false
        };
    });

    for (const [signature, override] of bySignature) {
        if (!present.has(signature)) {
            reattachments.push(
                reattachment(override, "not-applicable", "no cluster with this signature this run")
            );
        }
    }

    return { effective: { clusters }, reattachments };
};

/** Apply Plan overrides: edit, add or remove a prop, keyed by cluster signature plus prop name. */
export const applyPlanOverrides = (
    artifact: PlanArtifact,
    overrides: Override[]
): ApplyResult<PlanArtifact> => {
    const propOverrides = overrides.filter(override => override.correction.kind === "plan.prop");
    const bySignature = new Map<string, Override[]>();
    for (const override of propOverrides) {
        const list = bySignature.get(override.structuralSignature) ?? [];
        list.push(override);
        bySignature.set(override.structuralSignature, list);
    }
    const reattachments: Reattachment[] = [];
    const present = new Set(artifact.components.map(component => component.signature));

    const components = artifact.components.map(component => {
        const forComponent = bySignature.get(component.signature);
        if (!forComponent) {
            return component;
        }
        let props = [...component.props];
        for (const override of forComponent) {
            const correction = asKind(override.correction, "plan.prop");
            if (correction.op === "remove") {
                props = props.filter(prop => prop.name !== correction.propName);
            } else if (correction.op === "add") {
                if (!props.some(prop => prop.name === correction.propName)) {
                    props.push({
                        name: correction.propName,
                        type: correction.type ?? "text",
                        observedValues: []
                    });
                }
            } else {
                props = props.map(prop =>
                    prop.name === correction.propName
                        ? {
                              ...prop,
                              name: correction.newName ?? prop.name,
                              type: correction.type ?? prop.type
                          }
                        : prop
                );
            }
            reattachments.push(reattachment(override, "applied", null));
        }
        return { ...component, props };
    });

    for (const override of propOverrides) {
        if (!present.has(override.structuralSignature)) {
            reattachments.push(
                reattachment(
                    override,
                    "not-applicable",
                    "no planned component with this signature this run"
                )
            );
        }
    }

    return { effective: { components }, reattachments };
};

/** The set of normalised URLs a page-exclusion override removes (Discover, Capture, Segment). */
export const excludedPageUrls = (overrides: Override[]): Set<string> =>
    new Set(
        overrides
            .filter(override => override.correction.kind === "page.exclude")
            .map(override => override.structuralSignature)
    );

/** Per page-exclusion override: applied if its URL is present this run (so it's removed), else n/a. */
const pageExclusionReattachments = (
    overrides: Override[],
    presentUrls: Set<string>
): Reattachment[] =>
    overrides
        .filter(override => override.correction.kind === "page.exclude")
        .map(override =>
            presentUrls.has(override.structuralSignature)
                ? reattachment(override, "applied", null)
                : reattachment(override, "not-applicable", "the excluded page is absent this run")
        );

/**
 * Apply Discover overrides to the URL list: drop excluded URLs (`page.exclude` or `discover.url` exclude)
 * and append manually-added ones (`discover.url` add). An exclude reattaches if its URL is present this
 * run; an add always applies. Added URLs use their normalised form (a valid absolute URL) and their group.
 */
export const applyDiscoverOverrides = (
    artifact: DiscoverArtifact,
    overrides: Override[]
): ApplyResult<DiscoverArtifact> => {
    const present = new Set(artifact.urls.map(entry => normalizeUrl(entry.url)));
    const excluded = new Set<string>();
    const additions: DiscoveredUrl[] = [];
    const reattachments: Reattachment[] = [];

    for (const override of overrides) {
        const correction = override.correction;
        if (correction.kind === "page.exclude") {
            excluded.add(override.structuralSignature);
            reattachments.push(
                present.has(override.structuralSignature)
                    ? reattachment(override, "applied", null)
                    : reattachment(
                          override,
                          "not-applicable",
                          "the excluded page is absent this run"
                      )
            );
        } else if (correction.kind === "discover.url") {
            if (correction.action === "exclude") {
                excluded.add(override.structuralSignature);
                reattachments.push(
                    present.has(override.structuralSignature)
                        ? reattachment(override, "applied", null)
                        : reattachment(
                              override,
                              "not-applicable",
                              "the excluded URL is absent this run"
                          )
                );
            } else if (correction.action === "add") {
                additions.push({
                    url: override.structuralSignature,
                    group: correction.group ?? "manual"
                });
                reattachments.push(reattachment(override, "applied", null));
            }
        }
    }

    const kept = artifact.urls.filter(entry => !excluded.has(normalizeUrl(entry.url)));
    const existing = new Set(kept.map(entry => normalizeUrl(entry.url)));
    const urls = [...kept, ...additions.filter(entry => !existing.has(normalizeUrl(entry.url)))];

    return { effective: { ...artifact, urls }, reattachments };
};

/** Apply page-exclusion overrides to the captured pages — drop the excluded ones from pages and failed. */
export const applyCaptureOverrides = (
    artifact: CaptureArtifact,
    overrides: Override[]
): ApplyResult<CaptureArtifact> => {
    const excluded = excludedPageUrls(overrides);
    const present = new Set(artifact.pages.map(page => normalizeUrl(page.url)));
    const pages = artifact.pages.filter(page => !excluded.has(normalizeUrl(page.url)));
    const failed = artifact.failed.filter(url => !excluded.has(normalizeUrl(url)));
    return {
        effective: { ...artifact, pages, failed },
        reattachments: pageExclusionReattachments(overrides, present)
    };
};

/** Apply page-exclusion overrides to the segmented pages — drop the excluded ones. */
export const applySegmentOverrides = (
    artifact: SegmentArtifact,
    overrides: Override[]
): ApplyResult<SegmentArtifact> => {
    const excluded = excludedPageUrls(overrides);
    const present = new Set(artifact.pages.map(page => normalizeUrl(page.url)));
    const pages = artifact.pages.filter(page => !excluded.has(normalizeUrl(page.url)));
    return {
        effective: { ...artifact, pages },
        reattachments: pageExclusionReattachments(overrides, present)
    };
};

/** The accept/reject decision map (signature -> decision) from a job's generate.decision overrides (W8). */
export const decisionsFromOverrides = (
    overrides: Override[]
): Record<string, "accepted" | "rejected"> => {
    const map: Record<string, "accepted" | "rejected"> = {};
    for (const override of overrides) {
        if (override.stage === "generate" && override.correction.kind === "generate.decision") {
            map[override.structuralSignature] = override.correction.decision;
        }
    }
    return map;
};

/** The effective cluster similarity threshold — the latest parameter override, or the fallback. */
export const effectiveClusterThreshold = (overrides: Override[], fallback: number): number => {
    const latest = [...overrides]
        .reverse()
        .find(override => override.correction.kind === "cluster.threshold");
    return latest ? asKind(latest.correction, "cluster.threshold").threshold : fallback;
};
