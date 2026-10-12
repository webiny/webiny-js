// Pulls in the `TaskController` augmentation so `controller.response`/`logger` exist.
import "@webiny/background-tasks/api/types.js";
import { createHash } from "node:crypto";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { CreateTenantUseCase as CreateTmTenantUseCase } from "@webiny/tenant-manager/api/features/CreateTenant/abstractions.js";
import { CreateAndInstallTenantUseCase } from "@webiny/tenant-manager/api/features/CreateAndInstallTenant/abstractions.js";
import { JobRepository } from "@webiny/api-component-extraction/domain/abstractions.js";
import { ImageAssetService } from "@webiny/api-component-extraction/features/shared/ImageAssetService.js";
import { migrateImages } from "@webiny/api-component-extraction/features/stages/capture/migrateImages.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { GetRemoteComponentUseCase } from "@webiny/remote-components/api/features/getComponent/abstractions.js";
import { CreateRemoteComponentUseCase } from "@webiny/remote-components/api/features/createComponent/abstractions.js";
import { UpdateRemoteComponentUseCase } from "@webiny/remote-components/api/features/updateComponent/abstractions.js";
import type { RemoteComponentDto } from "@webiny/remote-components/shared/types.js";
import { GetThemeByIdUseCase } from "@webiny/api-theme/features/GetThemeById/index.js";
import { CreateThemeUseCase } from "@webiny/api-theme/features/CreateTheme/index.js";
import { PublishThemeUseCase } from "@webiny/api-theme/features/PublishTheme/index.js";
import { ActivateThemeUseCase } from "@webiny/api-theme/features/ActivateTheme/index.js";
import { BUILD_SITE_TASK_ID } from "~/constants.js";
import { ComposePagesService } from "~/domain/abstractions.js";
import { CompositionReaderAbstraction } from "~/features/composition/CompositionReader.js";
import type { PromotedReference, RunImage } from "~/features/composition/CompositionSource.js";
import {
    type SiteBuildStep,
    type SiteBuildStepRecord,
    type SiteRecord,
    SiteStore
} from "~/storage/SiteStore.js";

/**
 * Builds a job's site in its own tenant (compose-tenant-promotion-design.md): the tenant, the job's
 * theme, the components Promote chose, the run's images, and the composed pages.
 *
 * THE SEAM. Every step reads its extraction data first, in the extraction tenant, and only then enters
 * `withTenant(target)` to write. Nothing inside a `toTarget` callback may read extraction data: a read
 * there does not fail, it returns the target's data. Composition enforces this structurally (its
 * writer has no extraction dependency); the copy steps here keep each callback to writes and target
 * reads only.
 *
 * Runs after Promote, from what Promote chose: its components are copied with their prebuilt bundles,
 * so selection, collision handling and bundling stay Promote's, unchanged. Every step is idempotent, so
 * a retry reruns the build and finished steps are no-ops or cheap.
 *
 * PERMISSIONS, an open decision for a customer-facing deployment: the permission check reads the
 * wrong tenant. Permissions load per identity, not per tenant, so `tm.tenant` is checked against the
 * extraction tenant's grant and the writes into the new tenant check nothing tenant-specific. Whoever
 * may build a site can create and populate a tenant. Accepted for dev and the demo only.
 */
export interface BuildSiteTaskInput {
    runId: string;
}

const IMAGE_BATCH = 10;
const FETCH_CONCURRENCY = 6;

/** A readable tenant id from the job's name, made unique by the end of the job's id. */
export const siteTenantId = (jobName: string, jobId: string): string => {
    const slug = jobName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24);
    // The entry id, not the revision id: every job's ends "#0001", which distinguishes nothing.
    const entryId = jobId.split("#")[0];
    return `${slug || "site"}${entryId
        .replace(/[^a-z0-9]/gi, "")
        .slice(-4)
        .toLowerCase()}`;
};

/** A theme entry pinned at a version, as the revision id the theme use cases take. */
const themeRevisionId = (entryId: string, version: number): string =>
    `${entryId}#${String(version).padStart(4, "0")}`;

/**
 * What the pages step did, including what it did to pages that were already live. "1 with problems"
 * alone read as if the page were still up, when the old retirement had taken it down
 * (`a-rebuild-can-unpublish-a-working-page.md`).
 */
export const pagesDetail = (result: {
    created: number;
    failed: number;
    kept: string[];
    dropped: string[];
}): string => {
    const parts = [`${result.created} page(s) published`];
    if (result.failed > 0) {
        parts.push(`${result.failed} with problems, listed with the composed pages`);
    }
    if (result.kept.length > 0) {
        parts.push(
            `${result.kept.length} could not be rebuilt, so the earlier version stays live (${result.kept.join(", ")})`
        );
    }
    if (result.dropped.length > 0) {
        parts.push(
            `unpublished ${result.dropped.length} page(s) this run no longer has (${result.dropped.join(", ")})`
        );
    }
    return `${parts.join("; ")}.`;
};

class BuildSiteTaskHandlerImpl implements TaskHandler.Interface<BuildSiteTaskInput> {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface,
        private createTmTenant: CreateTmTenantUseCase.Interface,
        private createAndInstall: CreateAndInstallTenantUseCase.Interface,
        private jobs: JobRepository.Interface,
        private reader: CompositionReaderAbstraction.Interface,
        private composer: ComposePagesService.Interface,
        private sites: SiteStore.Interface,
        private listComponents: ListRemoteComponentsUseCase.Interface,
        private getComponent: GetRemoteComponentUseCase.Interface,
        private createComponent: CreateRemoteComponentUseCase.Interface,
        private updateComponent: UpdateRemoteComponentUseCase.Interface,
        private getThemeById: GetThemeByIdUseCase.Interface,
        private createTheme: CreateThemeUseCase.Interface,
        private publishTheme: PublishThemeUseCase.Interface,
        private activateTheme: ActivateThemeUseCase.Interface,
        private imageAssets: ImageAssetService.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<BuildSiteTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        // ---- Extraction tenant: everything the build reads. -------------------------------------
        // The source only; composition re-reads with the site's tenant for its own earlier pages.
        const read = await this.reader.read(input.runId);
        if (read.isFail()) {
            return controller.response.error(read.error.message);
        }
        const source = read.value;
        if (!source.promoted || source.promoted.length === 0) {
            return controller.response.error(
                "Publishing the site requires approved components (stage 9), at least one."
            );
        }
        const jobResult = await this.jobs.get(source.jobId);
        if (jobResult.isFail()) {
            return controller.response.error(jobResult.error.message);
        }
        const job = jobResult.value;

        const existing = await this.sites.get(job.id);
        const site: SiteRecord = existing ?? {
            jobId: job.id,
            tenantId: siteTenantId(job.name, job.id),
            tenantName: job.name,
            createdOn: new Date().toISOString()
        };
        site.lastBuild = {
            runId: input.runId,
            // The mutation that started this recorded the task id; keep it.
            taskId:
                existing?.lastBuild?.runId === input.runId ? existing.lastBuild.taskId : undefined,
            status: "running",
            startedOn: new Date().toISOString(),
            steps: []
        };

        const save = async () => {
            await this.sites.set(site);
        };
        const record = async (
            step: SiteBuildStep,
            status: SiteBuildStepRecord["status"],
            detail: string
        ) => {
            const steps = site.lastBuild!.steps.filter(item => item.step !== step);
            steps.push({ step, status, detail, at: new Date().toISOString() });
            site.lastBuild!.steps = steps;
            await save();
            await controller.logger.info({ message: `${step}: ${detail}` });
        };
        const fail = async (step: SiteBuildStep, message: string) => {
            await record(step, "failed", message);
            site.lastBuild!.status = "failed";
            site.lastBuild!.error = message;
            site.lastBuild!.finishedOn = new Date().toISOString();
            await save();
            return controller.response.error(`${step}: ${message}`);
        };
        await save();

        // ---- 1. The tenant. A root operation: creating it happens in the extraction tenant. -------
        await record("tenant", "running", `Preparing tenant "${site.tenantId}".`);
        const tenant = await this.ensureTenant(site);
        if (typeof tenant === "string") {
            return fail("tenant", tenant);
        }
        await record(
            "tenant",
            "done",
            existing ? `Reusing tenant "${tenant.id}".` : `Created tenant "${tenant.id}".`
        );
        const toTarget = <T>(cb: () => Promise<T>) => this.tenantContext.withTenant(tenant, cb);

        // ---- 2. The theme: read the job's pinned revision here, copy it in there. ----------------
        await record("theme", "running", "Copying the site's theme.");
        if (!job.themeEntryId || !job.themeVersion) {
            return fail("theme", "The job has no pinned theme to copy.");
        }
        const themeSourceId = themeRevisionId(job.themeEntryId, job.themeVersion);
        if (site.themeSourceId === themeSourceId && site.themeTargetId) {
            await record("theme", "done", "The theme is already in the tenant.");
        } else {
            const theme = await this.getThemeById.execute(themeSourceId);
            if (theme.isFail()) {
                return fail(
                    "theme",
                    `Could not read theme ${themeSourceId}: ${theme.error.message}`
                );
            }
            const sourceTheme = theme.value;
            const copied = await toTarget(async (): Promise<{ id: string } | { error: string }> => {
                const created = await this.createTheme.execute({
                    properties: sourceTheme.properties,
                    tokens: sourceTheme.tokens,
                    policy: sourceTheme.policy,
                    settings: sourceTheme.settings,
                    metadata: sourceTheme.metadata ?? {}
                });
                if (created.isFail()) {
                    return { error: created.error.message };
                }
                const published = await this.publishTheme.execute({
                    id: created.value.id,
                    comment: `Copied from the extraction job "${job.name}".`
                });
                if (published.isFail()) {
                    return { error: published.error.message };
                }
                const activated = await this.activateTheme.execute({
                    id: published.value.theme.id
                });
                return activated.isFail()
                    ? { error: activated.error.message }
                    : { id: published.value.theme.id };
            });
            if ("error" in copied) {
                return fail("theme", `Could not copy the theme: ${copied.error}`);
            }
            site.themeSourceId = themeSourceId;
            site.themeTargetId = copied.id;
            await record("theme", "done", "Copied, published and activated the site's theme.");
        }

        // ---- 3. Components: read Promote's records here, create or update them there. ----------
        await record("components", "running", `Copying ${source.promoted.length} component(s).`);
        const records: RemoteComponentDto[] = [];
        for (const item of source.promoted) {
            const found = await this.getComponent.execute(item.componentId);
            if (found.isFail()) {
                return fail("components", `Could not read "${item.name}": ${found.error.message}`);
            }
            records.push(found.value);
        }
        const promoted = await toTarget(async () => this.copyComponents(source.promoted!, records));
        if (typeof promoted === "string") {
            return fail("components", promoted);
        }
        await record(
            "components",
            "done",
            `${promoted.length} component(s) in the site's Library.`
        );

        // ---- 4. Images: fetch the bytes over HTTP, migrate them there through Capture's path. ------
        await record("images", "running", `Copying ${source.images.length} image(s).`);
        const images = await this.copyImages(source.images, toTarget);
        await record(
            "images",
            "done",
            `${images.copied} image(s) in the site's File Manager${
                images.failed > 0
                    ? `; ${images.failed} could not be copied and stay on their original host`
                    : ""
            }.`
        );

        // ---- 5. Pages: compose with the writer inside the target. ------------------------------
        await record("pages", "running", "Composing and publishing the pages.");
        const composed = await this.composer.execute(input.runId, { tenant, promoted });
        if (composed.isFail()) {
            return fail("pages", composed.error.message);
        }
        await record("pages", "done", pagesDetail(composed.value));

        site.lastBuild!.status = "done";
        site.lastBuild!.finishedOn = new Date().toISOString();
        await save();
        return controller.response.done(`Built the site in tenant "${tenant.id}".`);
    }

    /** The job's tenant: the one on record, or created now. A string is the reason it failed. */
    private async ensureTenant(site: SiteRecord): Promise<Tenant | string> {
        const found = await this.getTenantById.execute(site.tenantId);
        if (found.isOk()) {
            return found.value;
        }
        const entry = await this.createTmTenant.execute({
            id: site.tenantId,
            name: site.tenantName,
            description: `The migrated site of the extraction job "${site.tenantName}".`,
            extensions: {}
        });
        if (entry.isFail()) {
            return `Could not create the tenant: ${entry.error.message}`;
        }
        const installed = await this.createAndInstall.execute(entry.value.id);
        if (installed.isFail()) {
            return `Could not install the tenant: ${installed.error.message}`;
        }
        const created = await this.getTenantById.execute(site.tenantId);
        return created.isOk() ? created.value : `The tenant was created but cannot be read.`;
    }

    /**
     * Inside the target: create each component, or update it when this site already has one by that
     * name. Prebuilt bundles, so the bundle and its embedded name are exactly Promote's.
     */
    private async copyComponents(
        promoted: PromotedReference[],
        records: RemoteComponentDto[]
    ): Promise<PromotedReference[] | string> {
        const listed = await this.listComponents.execute();
        const idByName = new Map(
            (listed.isOk() ? listed.value.items : []).map(item => [item.name, item.id])
        );
        const result: PromotedReference[] = [];
        for (const [index, item] of promoted.entries()) {
            const record = records[index];
            const values = {
                name: record.name,
                label: record.label,
                description: record.description,
                source: record.source,
                css: record.css,
                bundle: {
                    bundledJs: record.bundledJs,
                    bundledJsSha256: record.bundledJsSha256,
                    bundledCss: record.bundledCss,
                    bundledCssSha256: record.bundledCssSha256,
                    manifest: record.manifest
                }
            };
            const existingId = idByName.get(record.name);
            const written = existingId
                ? await this.updateComponent.execute(existingId, values)
                : await this.createComponent.execute(values);
            if (written.isFail()) {
                return `Could not write "${record.name}": ${written.error.message}`;
            }
            result.push({
                signature: item.signature,
                componentId: written.value.id,
                name: written.value.name
            });
        }
        return result;
    }

    /**
     * Fetch each image's bytes from its copy in the extraction tenant (a public URL, so no tenant is
     * read), then migrate them inside the target exactly as Capture did: same captured URL, same
     * content hash, so composition's image lookup in the target finds them.
     */
    private async copyImages(
        images: RunImage[],
        toTarget: <T>(cb: () => Promise<T>) => Promise<T>
    ): Promise<{ copied: number; failed: number }> {
        let copied = 0;
        let failed = 0;
        for (let start = 0; start < images.length; start += IMAGE_BATCH) {
            const batch = images.slice(start, start + IMAGE_BATCH);
            const fetched: Array<{
                url: string;
                contentType: string;
                sha256: string;
                bytes: Uint8Array;
                size: number;
            }> = [];
            for (let offset = 0; offset < batch.length; offset += FETCH_CONCURRENCY) {
                const results = await Promise.all(
                    batch.slice(offset, offset + FETCH_CONCURRENCY).map(async image => {
                        try {
                            const response = await fetch(image.url);
                            if (!response.ok) {
                                return null;
                            }
                            const bytes = new Uint8Array(await response.arrayBuffer());
                            return {
                                url: image.sourceUrl,
                                contentType:
                                    response.headers.get("content-type") ??
                                    "application/octet-stream",
                                sha256: createHash("sha256").update(bytes).digest("hex"),
                                bytes,
                                size: bytes.byteLength
                            };
                        } catch {
                            return null;
                        }
                    })
                );
                for (const item of results) {
                    if (item) {
                        fetched.push(item);
                    } else {
                        failed += 1;
                    }
                }
            }
            if (fetched.length === 0) {
                continue;
            }
            const outcomes = await toTarget(() =>
                migrateImages(
                    this.imageAssets.deps(async () => {}),
                    fetched as never
                )
            );
            for (const outcome of outcomes) {
                if (outcome.kind === "migrated" || outcome.kind === "deduplicated") {
                    copied += 1;
                } else {
                    failed += 1;
                }
            }
        }
        return { copied, failed };
    }
}

const BuildSiteTaskHandler = TaskHandler.createImplementation({
    implementation: BuildSiteTaskHandlerImpl,
    dependencies: [
        TenantContext,
        GetTenantByIdUseCase,
        CreateTmTenantUseCase,
        CreateAndInstallTenantUseCase,
        JobRepository,
        CompositionReaderAbstraction,
        ComposePagesService,
        SiteStore,
        ListRemoteComponentsUseCase,
        GetRemoteComponentUseCase,
        CreateRemoteComponentUseCase,
        UpdateRemoteComponentUseCase,
        GetThemeByIdUseCase,
        CreateThemeUseCase,
        PublishThemeUseCase,
        ActivateThemeUseCase,
        ImageAssetService
    ]
});

class BuildSiteTaskImpl implements TaskDefinition.Interface<BuildSiteTaskInput> {
    readonly id = BUILD_SITE_TASK_ID;
    readonly title = "Page composition (PoC) — build the site in its own tenant";
    readonly description =
        "Creates the job's tenant if needed, then copies the theme, the promoted components and the images into it, and composes the pages there.";
    readonly maxIterations = 1;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = BuildSiteTaskHandler;
}

export const BuildSiteTask = TaskDefinition.createImplementation({
    implementation: BuildSiteTaskImpl,
    dependencies: []
});
