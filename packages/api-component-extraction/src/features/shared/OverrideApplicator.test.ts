import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { OverrideRepository } from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { ExtractionStorageError } from "~/domain/errors.js";
import type { ClusterArtifact } from "~/domain/artifacts.js";
import type { Override } from "~/domain/types.js";
import { OverrideApplicator, OverrideApplicatorService } from "./OverrideApplicator.js";

const CLUSTER_SIGNATURE = "sig-hero";

const machineArtifact = (): ClusterArtifact =>
    ({
        clusters: [
            {
                signature: CLUSTER_SIGNATURE,
                members: [{ signature: CLUSTER_SIGNATURE, url: "https://site/", sectionIndex: 0 }],
                representative: {
                    signature: CLUSTER_SIGNATURE,
                    url: "https://site/",
                    sectionIndex: 0
                },
                digest: {
                    structure: "div",
                    texts: [],
                    imageCount: 0,
                    linkCount: 0,
                    headingCount: 0
                },
                observedTexts: [],
                representativeCrop: { screenshotRef: "s", box: {}, cropRef: "c" }
            }
        ]
    }) as unknown as ClusterArtifact;

const excludeOverride = (signature: string): Override =>
    ({
        id: "override-1",
        entryId: "override-1",
        createdOn: "2026-09-21T00:00:00.000Z",
        tenant: "root",
        jobId: "job-1",
        stage: "cluster",
        structuralSignature: signature,
        originRunId: "run-1",
        correction: { kind: "cluster.exclude" }
    }) as unknown as Override;

interface Harness {
    applicator: OverrideApplicator.Interface;
    written: Map<string, unknown>;
}

const harness = (params: {
    listByJob: () => Promise<Result<Override[], ExtractionStorageError>>;
}): Harness => {
    const written = new Map<string, unknown>();
    const stored = new Map<string, unknown>([["machine-key", machineArtifact()]]);

    const container = new Container();
    container.registerInstance(OverrideRepository, {
        listByJob: params.listByJob
    } as unknown as OverrideRepository.Interface);
    container.registerInstance(StageArtifactStore, {
        getJson: async (key: string) => Result.ok(stored.get(key) ?? null),
        putJson: async (key: string, value: unknown) => {
            written.set(key, value);
            return Result.ok(undefined);
        }
    } as unknown as StageArtifactStore.Interface);
    container.register(OverrideApplicatorService);

    return { applicator: container.resolve(OverrideApplicator), written };
};

const applyCluster = (applicator: OverrideApplicator.Interface) =>
    applicator.apply({
        stage: "cluster",
        jobId: "job-1",
        runId: "run-1",
        artifacts: { clusters: "machine-key" },
        artifactKey: name => `key:${name}`
    });

describe("OverrideApplicator", () => {
    it("fails when the job's overrides cannot be read, instead of reverting the stage", async () => {
        const listByJob = vi
            .fn()
            .mockResolvedValue(Result.fail(new ExtractionStorageError("list overrides", "boom")));
        const { applicator, written } = harness({ listByJob });

        const result = await applyCluster(applicator);

        expect(result.isFail()).toBeTrue();
        expect(result.error.message).toMatch(/read the corrections/);
        // Nothing was written: an unreadable correction list must not silently discard the tuning.
        expect(written.size).toBe(0);
    });

    it("applies an override that matches", async () => {
        const listByJob = vi
            .fn()
            .mockResolvedValue(Result.ok([excludeOverride(CLUSTER_SIGNATURE)]));
        const { applicator, written } = harness({ listByJob });

        const result = await applyCluster(applicator);

        expect(result.isOk()).toBeTrue();
        expect(result.value.reattachments[0]).toMatchObject({ status: "applied", reason: null });
        expect(result.value.artifacts).toMatchObject({
            clusters: "key:clusters.effective",
            "clusters.machine": "machine-key"
        });

        const effective = written.get("key:clusters.effective") as ClusterArtifact;
        expect(effective.clusters[0]?.excluded).toBeTrue();
    });

    it("succeeds but reports the reason when an override cannot be applied", async () => {
        // A correction carried over from an earlier run whose cluster no longer exists: the operator
        // needs to know it did not reattach, and the run must still be usable.
        const listByJob = vi
            .fn()
            .mockResolvedValue(Result.ok([excludeOverride("sig-that-is-gone")]));
        const { applicator, written } = harness({ listByJob });

        const result = await applyCluster(applicator);

        expect(result.isOk()).toBeTrue();
        expect(result.value.reattachments[0]).toMatchObject({
            status: "not-applicable",
            kind: "cluster.exclude"
        });
        expect(result.value.reattachments[0]?.reason).toMatch(/absent this run/);

        const effective = written.get("key:clusters.effective") as ClusterArtifact;
        expect(effective.clusters[0]?.excluded).toBeFalsy();
    });

    it("fails when an applier throws rather than escaping as an unhandled rejection", async () => {
        // `applyClusterOverrides` orders corrections by `createdOn`, so losing it makes the applier
        // throw. Two of them, because `sort` never calls the comparator on a single element.
        const broken = [CLUSTER_SIGNATURE, "sig-other"].map(
            signature =>
                ({ ...excludeOverride(signature), createdOn: undefined }) as unknown as Override
        );
        const listByJob = vi.fn().mockResolvedValue(Result.ok(broken));
        const { applicator } = harness({ listByJob });

        const result = await applyCluster(applicator);

        expect(result.isFail()).toBeTrue();
        expect(result.error.message).toMatch(/apply the corrections for cluster/);
    });
});
