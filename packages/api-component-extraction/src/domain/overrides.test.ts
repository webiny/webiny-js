import { describe, expect, it } from "vitest";
import {
    applyCaptureOverrides,
    applyClassifyOverrides,
    applyClusterOverrides,
    applyDiscoverOverrides,
    applyPlanOverrides,
    decisionsFromOverrides,
    effectiveClusterThreshold,
    excludedPageUrls,
    normalizeUrl,
    overrideMode
} from "./overrides.js";
import type { Correction, Override } from "./types.js";
import type {
    ClassifyArtifact,
    Cluster,
    ClusterMember,
    PlanArtifact,
    SectionDigest
} from "./artifacts.js";

const digest = (texts: string[] = []): SectionDigest => ({
    structure: "section>h2,p",
    texts,
    imageCount: 0,
    linkCount: 0,
    headingCount: 1
});

const member = (sig: string, url: string, index = 0): ClusterMember => ({
    url,
    sectionIndex: index,
    signature: sig,
    cropRef: `crop-${sig}`,
    digest: digest([`text-${sig}`]),
    screenshotRef: `shot-${url}`,
    box: { x: 0, y: 0, width: 1440, height: 400 }
});

const cluster = (sig: string, members: ClusterMember[]): Cluster => ({
    signature: sig,
    members,
    representative: members[0],
    digest: digest([`text-${sig}`]),
    observedTexts: [`text-${sig}`],
    representativeCrop: {
        screenshotRef: "s",
        box: { x: 0, y: 0, width: 1, height: 1 },
        cropRef: "c"
    }
});

let counter = 0;
const override = (
    stage: Override["stage"],
    signature: string,
    correction: Correction
): Override => ({
    id: `o${counter++}`,
    entryId: "e",
    createdOn: "2026-01-01T00:00:00.000Z",
    tenant: "root",
    jobId: "job",
    stage,
    structuralSignature: signature,
    correction,
    originRunId: "run1"
});

describe("overrideMode", () => {
    it("marks the cluster threshold a parameter override and the rest artifact overrides", () => {
        expect(overrideMode("cluster.threshold")).toBe("parameter");
        expect(overrideMode("cluster.merge")).toBe("artifact");
        expect(overrideMode("classify.set")).toBe("artifact");
    });
});

describe("normalizeUrl", () => {
    it("drops the hash and trailing slash", () => {
        expect(normalizeUrl("https://x.com/about/#team")).toBe("https://x.com/about");
        expect(normalizeUrl("https://x.com/")).toBe("https://x.com/");
    });
});

describe("applyClusterOverrides — merge", () => {
    const artifact = {
        clusters: [
            cluster("A", [member("A", "/1")]),
            cluster("B", [member("B", "/2"), member("B", "/3", 1)]),
            cluster("C", [member("C", "/4")])
        ]
    };

    it("merges the clusters whose representatives match, taking the largest member set's rep", () => {
        const result = applyClusterOverrides(artifact, [
            override("cluster", "A", {
                kind: "cluster.merge",
                representativeSignatures: ["A", "B"]
            })
        ]);
        expect(result.effective.clusters.map(c => c.signature)).toEqual(["B", "C"]);
        const merged = result.effective.clusters[0];
        expect(merged.members).toHaveLength(3);
        expect(result.reattachments[0].status).toBe("applied");
    });

    it("is not-applicable when fewer than two of its clusters are present this run", () => {
        // Only "A" remains from the recorded pair {A, Z}.
        const result = applyClusterOverrides(artifact, [
            override("cluster", "A", {
                kind: "cluster.merge",
                representativeSignatures: ["A", "Z"]
            })
        ]);
        expect(result.effective.clusters.map(c => c.signature)).toEqual(["A", "B", "C"]);
        expect(result.reattachments[0].status).toBe("not-applicable");
        expect(result.reattachments[0].reason).toMatch(/at least two/);
    });

    it("honours a pinned representative", () => {
        const result = applyClusterOverrides(artifact, [
            override("cluster", "A", {
                kind: "cluster.merge",
                representativeSignatures: ["A", "B"],
                representativeSignature: "A"
            })
        ]);
        expect(result.effective.clusters[0].signature).toBe("A");
    });
});

describe("applyClusterOverrides — split", () => {
    it("pulls matching members out into a new cluster and drops emptied clusters", () => {
        const artifact = {
            clusters: [cluster("A", [member("A", "/1"), member("X", "/2"), member("X", "/3", 1)])]
        };
        const result = applyClusterOverrides(artifact, [
            override("cluster", "A", { kind: "cluster.split", memberSignatures: ["X"] })
        ]);
        expect(result.effective.clusters).toHaveLength(2);
        const split = result.effective.clusters.find(c => c.signature === "X")!;
        expect(split.members).toHaveLength(2);
        expect(split.observedTexts).toContain("text-X");
        expect(result.reattachments[0].status).toBe("applied");
    });

    it("is not-applicable when none of the split members are present", () => {
        const artifact = { clusters: [cluster("A", [member("A", "/1")])] };
        const result = applyClusterOverrides(artifact, [
            override("cluster", "A", { kind: "cluster.split", memberSignatures: ["Q"] })
        ]);
        expect(result.effective.clusters).toHaveLength(1);
        expect(result.reattachments[0].status).toBe("not-applicable");
    });
});

describe("applyClusterOverrides — move", () => {
    const base = () => ({
        clusters: [
            cluster("A", [member("A", "/1"), member("M", "/2")]),
            cluster("B", [member("B", "/3")])
        ]
    });

    it("moves the member into the target cluster", () => {
        const result = applyClusterOverrides(base(), [
            override("cluster", "M", {
                kind: "cluster.move",
                memberSignature: "M",
                targetRepresentativeSignature: "B"
            })
        ]);
        const b = result.effective.clusters.find(c => c.signature === "B")!;
        expect(b.members.map(m => m.signature)).toContain("M");
        expect(result.reattachments[0].status).toBe("applied");
    });

    it("is conflicting when the target cluster is absent, not-applicable when the member is absent", () => {
        const missingTarget = applyClusterOverrides(base(), [
            override("cluster", "M", {
                kind: "cluster.move",
                memberSignature: "M",
                targetRepresentativeSignature: "GONE"
            })
        ]);
        expect(missingTarget.reattachments[0].status).toBe("conflicting");

        const missingMember = applyClusterOverrides(base(), [
            override("cluster", "Q", {
                kind: "cluster.move",
                memberSignature: "Q",
                targetRepresentativeSignature: "B"
            })
        ]);
        expect(missingMember.reattachments[0].status).toBe("not-applicable");
    });
});

describe("applyClusterOverrides — exclude", () => {
    it("marks the cluster excluded but keeps it in the artifact", () => {
        const artifact = {
            clusters: [cluster("A", [member("A", "/1")]), cluster("B", [member("B", "/2")])]
        };
        const result = applyClusterOverrides(artifact, [
            override("cluster", "A", { kind: "cluster.exclude" })
        ]);
        expect(result.effective.clusters).toHaveLength(2);
        expect(result.effective.clusters.find(c => c.signature === "A")!.excluded).toBe(true);
    });
});

describe("applyClassifyOverrides", () => {
    const artifact: ClassifyArtifact = {
        clusters: [
            {
                cluster: cluster("A", [member("A", "/1")]),
                type: "unknown",
                name: "Section A",
                confidence: 0.2,
                unclassified: true
            }
        ]
    };

    it("sets name and type and clears unclassified", () => {
        const result = applyClassifyOverrides(artifact, [
            override("classify", "A", { kind: "classify.set", name: "Hero", type: "hero" })
        ]);
        expect(result.effective.clusters[0]).toMatchObject({
            name: "Hero",
            type: "hero",
            unclassified: false
        });
        expect(result.reattachments[0].status).toBe("applied");
    });

    it("reports not-applicable when the cluster is gone", () => {
        const result = applyClassifyOverrides(artifact, [
            override("classify", "GONE", { kind: "classify.set", name: "Hero" })
        ]);
        expect(result.reattachments[0].status).toBe("not-applicable");
    });
});

describe("applyPlanOverrides", () => {
    const artifact: PlanArtifact = {
        components: [
            {
                signature: "A",
                name: "Hero",
                type: "hero",
                props: [{ name: "title", type: "text", observedValues: [] }],
                tokenBindings: [],
                representative: member("A", "/1"),
                members: [member("A", "/1")],
                representativeCrop: {
                    screenshotRef: "s",
                    box: { x: 0, y: 0, width: 1, height: 1 },
                    cropRef: "c"
                },
                sourceTexts: []
            }
        ]
    };

    it("edits, adds and removes props", () => {
        const result = applyPlanOverrides(artifact, [
            override("plan", "A", {
                kind: "plan.prop",
                op: "edit",
                propName: "title",
                newName: "heading"
            }),
            override("plan", "A", {
                kind: "plan.prop",
                op: "add",
                propName: "subtitle",
                type: "text"
            })
        ]);
        const names = result.effective.components[0].props.map(p => p.name);
        expect(names).toEqual(["heading", "subtitle"]);
        expect(result.reattachments.every(r => r.status === "applied")).toBe(true);
    });
});

describe("applyCaptureOverrides (page exclusion)", () => {
    const artifact = {
        pages: [
            { url: "https://x.com/a" },
            { url: "https://x.com/b/" },
            { url: "https://x.com/c" }
        ],
        failed: ["https://x.com/d"]
    } as never;

    it("drops the excluded pages (matched by normalised URL) and reports reattachment", () => {
        const result = applyCaptureOverrides(artifact, [
            override("capture", "https://x.com/b", { kind: "page.exclude" }),
            override("capture", "https://x.com/gone", { kind: "page.exclude" })
        ]);
        expect(result.effective.pages.map(p => p.url)).toEqual([
            "https://x.com/a",
            "https://x.com/c"
        ]);
        const applied = result.reattachments.find(r => r.signature === "https://x.com/b");
        const missing = result.reattachments.find(r => r.signature === "https://x.com/gone");
        expect(applied?.status).toBe("applied");
        expect(missing?.status).toBe("not-applicable");
    });
});

describe("applyDiscoverOverrides", () => {
    const artifact = {
        entryUrl: "https://x.com",
        source: "sitemap",
        groups: ["root"],
        urls: [
            { url: "https://x.com/a", group: "root" },
            { url: "https://x.com/b", group: "root" }
        ]
    } as never;

    it("excludes a URL and appends a manually-added one", () => {
        const result = applyDiscoverOverrides(artifact, [
            override("discover", "https://x.com/a", { kind: "discover.url", action: "exclude" }),
            override("discover", "https://x.com/new", {
                kind: "discover.url",
                action: "add",
                group: "manual"
            })
        ]);
        expect(result.effective.urls.map(u => u.url)).toEqual([
            "https://x.com/b",
            "https://x.com/new"
        ]);
        expect(result.reattachments.every(r => r.status === "applied")).toBe(true);
    });

    it("reports an exclude as not-applicable when its URL is absent this run", () => {
        const result = applyDiscoverOverrides(artifact, [
            override("discover", "https://x.com/gone", { kind: "discover.url", action: "exclude" })
        ]);
        expect(result.reattachments[0].status).toBe("not-applicable");
    });
});

describe("decisionsFromOverrides", () => {
    it("builds the accept/reject map from generate.decision overrides", () => {
        const map = decisionsFromOverrides([
            override("generate", "A", { kind: "generate.decision", decision: "accepted" }),
            override("generate", "B", { kind: "generate.decision", decision: "rejected" }),
            override("cluster", "C", { kind: "cluster.exclude" })
        ]);
        expect(map).toEqual({ A: "accepted", B: "rejected" });
    });
});

describe("page + parameter helpers", () => {
    it("collects excluded page urls", () => {
        const set = excludedPageUrls([
            override("capture", "https://x.com/a", { kind: "page.exclude" }),
            override("capture", "https://x.com/b", { kind: "page.exclude" })
        ]);
        expect([...set]).toEqual(["https://x.com/a", "https://x.com/b"]);
    });

    it("resolves the effective threshold from the latest parameter override", () => {
        expect(
            effectiveClusterThreshold(
                [
                    override("cluster", "", { kind: "cluster.threshold", threshold: 0.7 }),
                    override("cluster", "", { kind: "cluster.threshold", threshold: 0.85 })
                ],
                0.5
            )
        ).toBe(0.85);
        expect(effectiveClusterThreshold([], 0.5)).toBe(0.5);
    });
});
