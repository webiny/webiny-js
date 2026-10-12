import { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import { RunRepository } from "@webiny/api-component-extraction/domain/abstractions.js";
import { BlobStore, StageArtifactStore } from "@webiny/api-component-extraction/domain/stage.js";
import { stageEntry } from "@webiny/api-component-extraction/domain/ledger.js";
import { stageArtifactKey } from "@webiny/api-component-extraction/constants.js";
import { readComponents } from "@webiny/api-component-extraction/domain/generatedComponents.js";
import type {
    AssembleArtifact,
    CaptureArtifact,
    CapturedNode,
    GenerateArtifact,
    PromoteArtifact,
    SegmentArtifact,
    SegmentedPage
} from "@webiny/api-component-extraction/domain/artifacts.js";
import type { AssetOutcome } from "@webiny/api-component-extraction/domain/assets.js";
import type { Run } from "@webiny/api-component-extraction/domain/types.js";
import { PageMapStore } from "~/domain/abstractions.js";
import { PageCompositionError } from "~/domain/errors.js";
import type {
    CompositionSource,
    EarlierComposition,
    RunImage
} from "~/features/composition/CompositionSource.js";

/**
 * The read half of composition: everything from the extraction tenant, read once, returned as data.
 *
 * Runs in the extraction tenant, always — never inside `withTenant`. It has no Website Builder,
 * Library or File Manager dependency, so it cannot write to or read from a site's tenant. Its output
 * (`CompositionSource`) is the only way extraction data reaches `CompositionWriter`.
 */
export interface ICompositionReader {
    /** With `tenantId`, the earlier compositions read are those into that site tenant. */
    read(
        runId: string,
        tenantId?: string
    ): Promise<Result<CompositionSource, PageCompositionError>>;
}

export const CompositionReaderAbstraction = createAbstraction<ICompositionReader>(
    "PageCompositionPoc/CompositionReader"
);
export namespace CompositionReaderAbstraction {
    export type Interface = ICompositionReader;
}

class CompositionReaderImpl implements ICompositionReader {
    constructor(
        private runs: RunRepository.Interface,
        private artifacts: StageArtifactStore.Interface,
        private blobs: BlobStore.Interface,
        private pageMaps: PageMapStore.Interface
    ) {}

    async read(
        runId: string,
        tenantId?: string
    ): Promise<Result<CompositionSource, PageCompositionError>> {
        const runResult = await this.runs.get(runId);
        if (runResult.isFail()) {
            return Result.fail(new PageCompositionError(`Run ${runId} could not be read.`));
        }
        const run = runResult.value;

        const assemble = await this.readArtifact<AssembleArtifact>(run, "assemble", "assembly");
        if (assemble.isFail()) {
            return Result.fail(assemble.error);
        }
        const generate = await this.readArtifact<GenerateArtifact>(run, "generate", "components");
        if (generate.isFail()) {
            return Result.fail(generate.error);
        }
        const segment = await this.readArtifact<SegmentArtifact>(run, "segment", "sections");
        if (segment.isFail()) {
            return Result.fail(segment.error);
        }
        // Optional here; whoever needs it (same-tenant compose, building a site) says so.
        const promote = await this.readArtifact<PromoteArtifact>(run, "promote", "promotion");

        const resolved = await readComponents(this.artifacts, generate.value);
        if (resolved.isFail()) {
            return Result.fail(
                new PageCompositionError(
                    `The generated components of this run could not be read: ${resolved.error.message}`
                )
            );
        }
        const generated = resolved.value;

        const segmentByUrl = new Map(segment.value.pages.map(page => [page.url, page]));

        /*
         * Every tree the writer will touch, loaded now: each assembled page's own, and each
         * component's reference member's (`referenceRuns`). The writer resolves sections from this map
         * and has no way to read a tree it was not given.
         */
        const needed = new Set<string>([
            ...assemble.value.pages.map(page => page.url),
            ...generated.map(component => component.members[0]?.url).filter(Boolean)
        ] as string[]);
        const trees = new Map<string, CapturedNode>();
        for (const url of needed) {
            const page = segmentByUrl.get(url);
            if (page && !trees.has(page.treeRef)) {
                const tree = await this.pageTree(page);
                if (tree) {
                    trees.set(page.treeRef, tree);
                }
            }
        }

        const images = await this.runImages(run);

        const previous = await this.pageMaps.get(runId, tenantId);
        const composeVersion = (previous.isOk() ? (previous.value?.composeVersion ?? 0) : 0) + 1;

        /*
         * This run's previous composition and every other run's of the same job, each with the tenant
         * it was written to. A job is a site, so only one composition of it can be live per tenant.
         */
        const earlier: EarlierComposition[] = [];
        if (previous.isOk() && previous.value) {
            earlier.push({
                runId,
                tenantId: previous.value.tenantId,
                pages: [...previous.value.pages, ...(previous.value.kept ?? [])]
            });
        }
        const siblings = await this.runs.listByJob(run.jobId);
        if (siblings.isOk()) {
            for (const sibling of siblings.value.runs) {
                if (sibling.id === runId) {
                    continue;
                }
                const map = await this.pageMaps.get(sibling.id, tenantId);
                if (map.isOk() && map.value) {
                    earlier.push({
                        runId: sibling.id,
                        tenantId: map.value.tenantId,
                        pages: [...map.value.pages, ...(map.value.kept ?? [])]
                    });
                }
            }
        }

        return Result.ok({
            runId,
            jobId: run.jobId,
            assemble: assemble.value,
            generated,
            segmentByUrl,
            trees,
            promoted: promote.isOk()
                ? promote.value.promoted.map(item => ({
                      signature: item.signature,
                      componentId: item.componentId,
                      name: item.name
                  }))
                : null,
            ...(promote.isOk() && promote.value.tenantId
                ? { promotedTenantId: promote.value.tenantId }
                : {}),
            images,
            composeVersion,
            earlier
        });
    }

    /** The run's migrated images, from Capture's per-image outcomes. Empty when it recorded none. */
    private async runImages(run: Run): Promise<RunImage[]> {
        const capture = await this.readArtifact<CaptureArtifact>(run, "capture", "pages");
        const ref = capture.isOk() ? capture.value.assets?.assetOutcomesRef : undefined;
        if (!ref) {
            return [];
        }
        const bytes = await this.blobs.get(ref);
        if (bytes.isFail()) {
            return [];
        }
        try {
            const outcomes = JSON.parse(new TextDecoder().decode(bytes.value)) as AssetOutcome[];
            const byUrl = new Map<string, RunImage>();
            for (const outcome of outcomes) {
                if (outcome.kind === "migrated" || outcome.kind === "deduplicated") {
                    byUrl.set(outcome.sourceUrl, {
                        sourceUrl: outcome.sourceUrl,
                        url: outcome.url,
                        sha256: outcome.sha256
                    });
                }
            }
            return [...byUrl.values()];
        } catch {
            return [];
        }
    }

    private async pageTree(page: SegmentedPage): Promise<CapturedNode | null> {
        const bytes = await this.blobs.get(page.treeRef);
        if (bytes.isFail()) {
            return null;
        }
        try {
            return JSON.parse(new TextDecoder().decode(bytes.value)) as CapturedNode;
        } catch {
            return null;
        }
    }

    private async readArtifact<T>(
        run: Run,
        stage: "capture" | "assemble" | "promote" | "generate" | "segment",
        name: string
    ): Promise<Result<T, PageCompositionError>> {
        const entry = stageEntry(run.stages, stage);
        if (!entry || entry.status !== "done") {
            return Result.fail(
                new PageCompositionError(`The ${stage} stage has not completed on this run.`, {
                    stage
                })
            );
        }

        /*
         * Take the ref the ledger records, not a key computed from the name. A stage with corrections
         * applied keeps its machine output at `<name>` and records the EFFECTIVE artifact as the
         * primary ref, so computing the key would quietly read the un-overridden output — Segment is
         * the one that matters here, where a `page.exclude` correction would otherwise be ignored and
         * pages the operator dropped would be composed anyway.
         *
         * The computed key stays as the fallback for runs written before the refs were named.
         */
        const key =
            entry.artifacts[name] ?? stageArtifactKey(run.id, stage, entry.stageVersion, name);
        const result = await this.artifacts.getJson<T>(key);
        if (result.isFail() || !result.value) {
            return Result.fail(
                new PageCompositionError(`The ${stage} artifact of this run could not be read.`, {
                    stage,
                    key
                })
            );
        }

        return Result.ok(result.value);
    }
}

export const CompositionReader = CompositionReaderAbstraction.createImplementation({
    implementation: CompositionReaderImpl,
    dependencies: [RunRepository, StageArtifactStore, BlobStore, PageMapStore]
});
