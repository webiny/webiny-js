import { createAbstraction } from "@webiny/feature/api";
import {
    JobRepository,
    RunRepository
} from "@webiny/api-component-extraction/domain/abstractions.js";
import type { Job, Run } from "@webiny/api-component-extraction/domain/types.js";
import type {
    CaptureArtifact,
    PlanArtifact,
    PromoteArtifact
} from "@webiny/api-component-extraction/domain/artifacts.js";
import type { AssetOutcome } from "@webiny/api-component-extraction/domain/assets.js";
import { BlobStore, StageArtifactStore } from "@webiny/api-component-extraction/domain/stage.js";
import { stageArtifactKey } from "@webiny/api-component-extraction/constants.js";
import { JobDataEraser } from "@webiny/api-component-extraction/features/deletion/JobDataEraser.js";
import { ListPagesUseCase } from "@webiny/api-website-builder/features/pages/ListPages/abstractions.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { ListDeletedPagesUseCase } from "@webiny/api-website-builder/features/pages/ListDeletedPages/abstractions.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/abstractions.js";
import { ActiveThemeStore } from "@webiny/api-theme/features/ActiveThemeStore/index.js";
import { PageMapStore } from "~/domain/abstractions.js";
import { SiteStore } from "~/storage/SiteStore.js";
import {
    planJobDeletion,
    type DeletionApproval,
    type DeletionImage,
    type DeletionPage
} from "./planJobDeletion.js";
import { SiteTenantEraser } from "./SiteTenantEraser.js";
import type { JobDeletionPlan, SiteDeletionPlan } from "./JobDeletionStore.js";

/** A run, with what the planner and the eraser need from its stored artifacts. */
export interface ReadRun {
    run: Run;
    approvals: DeletionApproval[];
    images: DeletionImage[];
    signatures: string[];
}

export interface JobDeletionRead {
    job: Job;
    runs: ReadRun[];
    plan: JobDeletionPlan;
}

/**
 * Everything a delete decides from, read fresh: the job and its runs, every other job (for the
 * sharing checks), root's pages, Library and files, and the site. Too much for a request (every root
 * page with its elements, every run's approvals and images), so the delete task calls it, once to
 * show the counts and again when deleting, so it acts on what is there then, not on what was shown.
 */
export interface IJobDeletionReader {
    read(jobId: string): Promise<JobDeletionRead | string>;
}

export const JobDeletionReader = createAbstraction<IJobDeletionReader>(
    "PageCompositionPoc/JobDeletionReader"
);
export namespace JobDeletionReader {
    export type Interface = IJobDeletionReader;
}

const reason = (error: unknown): string =>
    (error as { message?: string })?.message ?? String(error);

class JobDeletionReaderImpl implements IJobDeletionReader {
    constructor(
        private jobs: JobRepository.Interface,
        private runs: RunRepository.Interface,
        private artifacts: StageArtifactStore.Interface,
        private blobs: BlobStore.Interface,
        private eraser: JobDataEraser.Interface,
        private pageMaps: PageMapStore.Interface,
        private sites: SiteStore.Interface,
        private siteEraser: SiteTenantEraser.Interface,
        private listPages: ListPagesUseCase.Interface,
        private listDeletedPages: ListDeletedPagesUseCase.Interface,
        private listComponents: ListRemoteComponentsUseCase.Interface,
        private listFiles: ListFilesUseCase.Interface,
        private activeTheme: ActiveThemeStore.Interface
    ) {}

    async read(jobId: string): Promise<JobDeletionRead | string> {
        const jobResult = await this.jobs.get(jobId);
        if (jobResult.isFail()) {
            return `Could not read the job: ${reason(jobResult.error)}`;
        }
        const job = jobResult.value;

        const allJobs = await this.allJobs();
        if (typeof allJobs === "string") {
            return allJobs;
        }
        const others = allJobs.filter(other => other.id !== job.id);

        const runs = await this.readRuns(job.id, true);
        if (typeof runs === "string") {
            return runs;
        }
        const otherComponentIds: string[] = [];
        const otherImageFileIds: string[] = [];
        for (const other of others) {
            const otherRuns = await this.readRuns(other.id, false);
            if (typeof otherRuns === "string") {
                return otherRuns;
            }
            for (const read of otherRuns) {
                for (const approval of read.approvals) {
                    otherComponentIds.push(...approval.promoted.map(item => item.componentId));
                }
                otherImageFileIds.push(...read.images.map(image => image.fileId));
            }
        }

        const runIds = new Set(runs.map(read => read.run.id));
        const mappedEntryIds: string[] = [];
        for (const runId of runIds) {
            for (const drafts of [false, true]) {
                const map = await this.pageMaps.get(runId, undefined, drafts);
                // A map with a tenant recorded pages in the site tenant; they go with the tenant.
                if (map.isOk() && map.value && !map.value.tenantId) {
                    for (const entry of [
                        ...map.value.pages,
                        ...(map.value.kept ?? []),
                        ...(map.value.dropped ?? [])
                    ]) {
                        mappedEntryIds.push(entry.entryId);
                    }
                }
            }
        }

        const rootPages = await this.rootPages();
        if (typeof rootPages === "string") {
            return rootPages;
        }
        const components = await this.listComponents.execute();
        if (components.isFail()) {
            return `Could not list root's components: ${reason(components.error)}`;
        }
        const referenceFileIds = await this.referenceFiles(runIds);
        if (typeof referenceFileIds === "string") {
            return referenceFileIds;
        }
        const active = await this.activeTheme.get();

        const root = planJobDeletion({
            job: {
                id: job.id,
                name: job.name,
                themeEntryId: job.themeEntryId,
                extractedThemeEntryId: job.themeExtraction?.themeEntryId ?? null
            },
            approvals: runs.flatMap(read => read.approvals),
            images: runs.flatMap(read => read.images),
            mappedEntryIds,
            referenceFileIds,
            others: {
                componentIds: otherComponentIds,
                themeEntryIds: others.map(other => other.themeEntryId).filter(Boolean),
                imageFileIds: otherImageFileIds
            },
            activeThemeEntryId: active.isOk() ? (active.value?.entryId ?? null) : null,
            rootPages,
            rootComponents: components.value.items.map(item => ({ id: item.id, name: item.name }))
        });

        const site = await this.site(job.id);
        if (typeof site === "string") {
            return site;
        }

        let modelCalls = 0;
        for (const runId of runIds) {
            modelCalls += await this.eraser.countModelCalls(runId);
        }
        const corrections = await this.eraser.countCorrections([...runIds]);

        return {
            job,
            runs,
            plan: {
                jobId: job.id,
                jobName: job.name,
                computedOn: new Date().toISOString(),
                blocked: await this.blocked(job.id, runs),
                runs: runs.length,
                modelCalls,
                corrections,
                root,
                site
            }
        };
    }

    /** Every job, page by page: the list query stops at 50, and the sharing checks cannot. */
    private async allJobs(): Promise<Job[] | string> {
        const jobs: Job[] = [];
        let after: string | null = null;
        do {
            const listed = await this.jobs.list({ limit: 100, after });
            if (listed.isFail()) {
                return `Could not list the jobs: ${reason(listed.error)}`;
            }
            jobs.push(...listed.value.jobs);
            after = listed.value.meta.hasMoreItems ? listed.value.meta.cursor : null;
        } while (after);
        return jobs;
    }

    /**
     * A job's runs with every version of their approvals and image outcomes. Earlier versions are read
     * by key, since the ledger names only the current one: an image an earlier capture used, or a
     * component an earlier approval created, is still in root.
     */
    private async readRuns(jobId: string, own: boolean): Promise<ReadRun[] | string> {
        const runs: Run[] = [];
        let after: string | null = null;
        do {
            const listed = await this.runs.listByJob(jobId, { limit: 100, after });
            if (listed.isFail()) {
                return `Could not list the runs of job ${jobId}: ${reason(listed.error)}`;
            }
            runs.push(...listed.value.runs);
            after = listed.value.meta.hasMoreItems ? listed.value.meta.cursor : null;
        } while (after);

        const read: ReadRun[] = [];
        for (const listedRun of runs) {
            // The listing's ledger can lag; the run read takes the authoritative one.
            const full = await this.runs.get(listedRun.id);
            const run = full.isOk() ? full.value : listedRun;
            const versions = (stage: string) =>
                run.stages.find(entry => entry.stage === stage)?.stageVersion ?? 0;

            const approvals: DeletionApproval[] = [];
            for (let version = 1; version <= versions("promote"); version++) {
                const artifact = await this.artifacts.getJson<PromoteArtifact>(
                    stageArtifactKey(run.id, "promote", version, "promotion")
                );
                if (artifact.isOk() && artifact.value) {
                    approvals.push({
                        runId: run.id,
                        ...(artifact.value.tenantId ? { tenantId: artifact.value.tenantId } : {}),
                        promoted: artifact.value.promoted.map(item => ({
                            componentId: item.componentId,
                            name: item.name
                        }))
                    });
                }
            }

            const images: DeletionImage[] = [];
            for (let version = 1; version <= versions("capture"); version++) {
                const artifact = await this.artifacts.getJson<CaptureArtifact>(
                    stageArtifactKey(run.id, "capture", version, "pages")
                );
                const ref = artifact.isOk() ? artifact.value?.assets?.assetOutcomesRef : undefined;
                if (!ref) {
                    continue;
                }
                const blob = await this.blobs.get(ref);
                if (blob.isFail()) {
                    // A version whose outcomes are gone uses nothing that could still be found.
                    continue;
                }
                const outcomes = JSON.parse(new TextDecoder().decode(blob.value)) as AssetOutcome[];
                for (const outcome of outcomes) {
                    if (outcome.kind === "migrated" || outcome.kind === "deduplicated") {
                        images.push({
                            fileId: outcome.fileId,
                            sha256: outcome.sha256,
                            sourceUrl: outcome.sourceUrl
                        });
                    }
                }
            }

            const signatures = new Set<string>();
            if (own) {
                for (let version = 1; version <= versions("plan"); version++) {
                    for (const name of ["plan", "plan.machine"]) {
                        const plan = await this.artifacts.getJson<PlanArtifact>(
                            stageArtifactKey(run.id, "plan", version, name)
                        );
                        for (const component of (plan.isOk() && plan.value?.components) || []) {
                            signatures.add(component.signature);
                        }
                    }
                }
            }

            read.push({ run, approvals, images, signatures: [...signatures] });
        }
        return read;
    }

    /** Every root page, its latest revision in any state, and every page in the bin, with names. */
    private async rootPages(): Promise<DeletionPage[] | string> {
        const pages: DeletionPage[] = [];
        for (const deleted of [false, true]) {
            let after: string | null = null;
            do {
                const listed = await this.pageBatch(deleted, after);
                if (typeof listed === "string") {
                    return listed;
                }
                for (const page of listed.pages) {
                    const names = new Set<string>();
                    for (const element of Object.values(page.elements ?? {})) {
                        const name = (element as { component?: { name?: unknown } } | null)
                            ?.component?.name;
                        if (typeof name === "string") {
                            names.add(name);
                        }
                    }
                    pages.push({ id: page.id, entryId: page.entryId, deleted, names: [...names] });
                }
                after = listed.cursor;
            } while (after);
        }
        return pages;
    }

    /** Reference images record the run they were made for in their metadata. */
    private async referenceFiles(runIds: Set<string>): Promise<string[] | string> {
        const ids: string[] = [];
        let after: string | null = null;
        do {
            const listed = await this.listFiles.execute({ limit: 500, after });
            if (listed.isFail()) {
                return `Could not list root's files: ${reason(listed.error)}`;
            }
            for (const file of listed.value.items) {
                const runId = file.metadata?.componentExtractionRunId;
                if (typeof runId === "string" && runIds.has(runId)) {
                    ids.push(file.id);
                }
            }
            after = listed.value.meta.hasMoreItems ? (listed.value.meta.cursor ?? null) : null;
        } while (after);
        return ids;
    }

    private async site(jobId: string): Promise<SiteDeletionPlan | null | string> {
        const record = await this.sites.get(jobId);
        if (!record) {
            return null;
        }
        const tenant = await this.siteEraser.find(record.tenantId);
        if (!tenant) {
            return {
                tenantId: record.tenantId,
                exists: false,
                live: false,
                pages: 0,
                publishedPages: 0,
                components: 0,
                files: 0,
                themes: 0
            };
        }
        const counts = await this.siteEraser.count(tenant);
        if (typeof counts === "string") {
            return counts;
        }
        return {
            tenantId: record.tenantId,
            exists: true,
            live: counts.publishedPages > 0,
            ...counts
        };
    }

    /** A stage running or about to, or a site build running: deleting under it would race it. */
    private async blocked(jobId: string, runs: ReadRun[]): Promise<string | null> {
        const running = runs.some(({ run }) =>
            run.stages.some(
                entry =>
                    entry.status === "running" ||
                    (entry.status as string) === "starting" ||
                    Boolean(entry.pendingTaskId)
            )
        );
        if (running) {
            return "A run of this job is running. Cancel it, or wait for it to finish.";
        }
        const site = await this.sites.get(jobId);
        if (site?.lastBuild?.status === "running" || site?.lastPreview?.status === "running") {
            return "This job's site is being built. Wait for it to finish.";
        }
        return null;
    }

    /** One page of pages, live or in the bin, and the cursor to the next. */
    private async pageBatch(
        deleted: boolean,
        after: string | null
    ): Promise<{ pages: WbPage[]; cursor: string | null } | string> {
        const params = { where: { latest: true }, sort: [], limit: 100, after };
        const listed = deleted
            ? await this.listDeletedPages.execute(params)
            : await this.listPages.execute(params);
        if (listed.isFail()) {
            return `Could not list root's pages: ${reason(listed.error)}`;
        }
        return {
            pages: listed.value.pages,
            cursor: listed.value.meta.hasMoreItems ? listed.value.meta.cursor : null
        };
    }
}

export const JobDeletionReaderImplementation = JobDeletionReader.createImplementation({
    implementation: JobDeletionReaderImpl,
    dependencies: [
        JobRepository,
        RunRepository,
        StageArtifactStore,
        BlobStore,
        JobDataEraser,
        PageMapStore,
        SiteStore,
        SiteTenantEraser,
        ListPagesUseCase,
        ListDeletedPagesUseCase,
        ListRemoteComponentsUseCase,
        ListFilesUseCase,
        ActiveThemeStore
    ]
});
