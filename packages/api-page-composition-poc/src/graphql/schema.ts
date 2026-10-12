import { ErrorResponse, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import {
    JobRepository,
    RunRepository
} from "@webiny/api-component-extraction/domain/abstractions.js";
import { ComponentExtractionPermissions } from "@webiny/api-component-extraction/features/permissions.js";
import { stageEntry } from "@webiny/api-component-extraction/domain/ledger.js";
import { BlobStore, StageArtifactStore } from "@webiny/api-component-extraction/domain/stage.js";
import type {
    GenerateArtifact,
    PromoteArtifact
} from "@webiny/api-component-extraction/domain/artifacts.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/abstractions.js";
import { siteResult } from "~/pages/siteResult.js";
import { ComposedCaptureStore, PageMapStore } from "~/domain/abstractions.js";
import {
    BUILD_SITE_TASK_ID,
    COMPOSE_PAGES_TASK_ID,
    composedScreenshotKey,
    UPLOAD_URL_SECONDS
} from "~/constants.js";
import type { BuildSiteTaskInput } from "~/features/site/BuildSiteTask.js";
import { SiteStore } from "~/storage/SiteStore.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { GetPageByPathUseCase } from "@webiny/api-website-builder/features/pages/GetPageByPath/abstractions.js";
import { ListPagesUseCase } from "@webiny/api-website-builder/features/pages/ListPages/abstractions.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { siteInventory } from "~/pages/siteInventory.js";
import type { ComposedCapture, ComposedCapturePage } from "~/domain/types.js";
import { pageCompositionTypeDefs } from "./typeDefs.js";
import type { ComposePagesTaskInput } from "~/features/ComposePagesTask.js";

/** Thin resolvers: authorize, delegate, map onto the `{ data, error }` envelope. */
const resolve = async (fn: () => Promise<unknown>) => {
    try {
        return new Response(await fn());
    } catch (error) {
        return new ErrorResponse(error);
    }
};

export const addPageCompositionSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(pageCompositionTypeDefs);

    builder.addResolver({
        path: "Mutation.pageCompositionPocComposePages",
        dependencies: [ComponentExtractionPermissions, RunRepository, JobRepository, TaskService],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            jobRepository: JobRepository.Interface,
            taskService: TaskService.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    // The PoC has no permission of its own: composing pages from a run is an
                    // extraction operator's act, and a throwaway package should not leave a
                    // permission behind in the system when it goes.
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }

                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;

                    const assemble = stageEntry(run.stages, "assemble");
                    if (!assemble || assemble.status !== "done") {
                        throw new Error("Page composition requires Assemble to be done.");
                    }
                    const promote = stageEntry(run.stages, "promote");
                    if (!promote || promote.status !== "done") {
                        throw new Error(
                            "Page composition requires Promote to be done — a page addresses a component by the name it was promoted under."
                        );
                    }

                    /*
                     * A job that approves into its site tenant composes there, as drafts: the site
                     * build's own task with `preview`, which brings the theme and images in too. Older
                     * jobs compose in the extraction tenant, as before.
                     */
                    const job = await jobRepository.get(run.jobId);
                    if (job.isOk() && job.value.siteTenantFromStart) {
                        const previewed = await taskService.trigger<BuildSiteTaskInput>({
                            definition: BUILD_SITE_TASK_ID,
                            name: `Page composition (PoC) — preview run ${run.runNumber} in the site tenant`,
                            input: { runId: run.id, preview: true }
                        });
                        if (previewed.isFail()) {
                            throw previewed.error;
                        }
                        return { taskId: previewed.value.id, runId: run.id };
                    }

                    const triggered = await taskService.trigger<ComposePagesTaskInput>({
                        definition: COMPOSE_PAGES_TASK_ID,
                        name: `Page composition (PoC) — run ${run.runNumber}`,
                        input: { runId: run.id }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }

                    return { taskId: triggered.value.id, runId: run.id };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.pageCompositionPocBuildSite",
        dependencies: [ComponentExtractionPermissions, RunRepository, TaskService, SiteStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            taskService: TaskService.Interface,
            sites: SiteStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }
                    const run = runResult.value;
                    for (const stage of ["assemble", "promote"] as const) {
                        if (stageEntry(run.stages, stage)?.status !== "done") {
                            throw new Error(`Building the site requires ${stage} to be done.`);
                        }
                    }
                    const site = await sites.get(run.jobId);
                    if (site?.lastBuild?.status === "running") {
                        throw new Error("This job's site is already being built.");
                    }

                    const triggered = await taskService.trigger<BuildSiteTaskInput>({
                        definition: BUILD_SITE_TASK_ID,
                        name: `Build site (PoC) — run ${run.runNumber}`,
                        input: { runId: run.id }
                    });
                    if (triggered.isFail()) {
                        throw triggered.error;
                    }
                    if (site) {
                        await sites.set({
                            ...site,
                            lastBuild: {
                                runId: run.id,
                                taskId: triggered.value.id,
                                status: "running",
                                startedOn: new Date().toISOString(),
                                steps: []
                            }
                        });
                    }
                    return { taskId: triggered.value.id, runId: run.id };
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocSite",
        dependencies: [ComponentExtractionPermissions, SiteStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            sites: SiteStore.Interface
        ) {
            return ({ args }: { args: { jobId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }
                    return sites.get(args.jobId);
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocSiteLivePages",
        dependencies: [
            ComponentExtractionPermissions,
            SiteStore,
            TenantContext,
            GetTenantByIdUseCase,
            GetPageByPathUseCase
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            sites: SiteStore.Interface,
            tenantContext: TenantContext.Interface,
            getTenantById: GetTenantByIdUseCase.Interface,
            getPageByPath: GetPageByPathUseCase.Interface
        ) {
            return ({ args }: { args: { jobId: string; paths: string[] } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }
                    // The tenant comes from the job's site record, never from the caller.
                    const site = await sites.get(args.jobId);
                    if (!site) {
                        return null;
                    }
                    const tenant = await getTenantById.execute(site.tenantId);
                    if (tenant.isFail()) {
                        throw new Error(`The site's tenant "${site.tenantId}" cannot be read.`);
                    }
                    /*
                     * Inside the site's tenant: asked from the admin's, a path answers with that
                     * tenant's page at the same path, and the site's pages look superseded or live
                     * when they are neither.
                     */
                    return tenantContext.withTenant(tenant.value, async () => {
                        const live: Record<string, string | null> = {};
                        for (const path of args.paths) {
                            const page = await getPageByPath.execute(path);
                            live[path] = page.isOk() ? page.value.id : null;
                        }
                        return live;
                    });
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocSiteInventory",
        dependencies: [
            ComponentExtractionPermissions,
            SiteStore,
            TenantContext,
            GetTenantByIdUseCase,
            ListPagesUseCase,
            ListRemoteComponentsUseCase,
            RunRepository,
            StageArtifactStore
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            sites: SiteStore.Interface,
            tenantContext: TenantContext.Interface,
            getTenantById: GetTenantByIdUseCase.Interface,
            listPages: ListPagesUseCase.Interface,
            listComponents: ListRemoteComponentsUseCase.Interface,
            runs: RunRepository.Interface,
            artifacts: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { jobId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }
                    // The tenant comes from the job's site record, never from the caller.
                    const site = await sites.get(args.jobId);
                    if (!site) {
                        return null;
                    }
                    const tenant = await getTenantById.execute(site.tenantId);
                    if (tenant.isFail()) {
                        throw new Error(`The site's tenant "${site.tenantId}" cannot be read.`);
                    }
                    /*
                     * The current approval, when it lives in this tenant: its components are waiting
                     * for the next publish, not left over. Read in the extraction tenant, before
                     * entering the site's. The run is the one last previewed or published.
                     */
                    const latest = [site.lastPreview, site.lastBuild]
                        .filter(Boolean)
                        .sort((a, b) => b!.startedOn.localeCompare(a!.startedOn))[0];
                    let approvedNames: string[] | undefined;
                    if (latest) {
                        const run = await runs.get(latest.runId);
                        const ref = run.isOk()
                            ? stageEntry(run.value.stages, "promote")?.artifacts?.promotion
                            : undefined;
                        const approval = ref ? await artifacts.getJson<PromoteArtifact>(ref) : null;
                        if (approval?.isOk() && approval.value?.tenantId === site.tenantId) {
                            approvedNames = approval.value.promoted.map(item => item.name);
                        }
                    }
                    return tenantContext.withTenant(tenant.value, async () => {
                        const pages: Array<{ status: string; elements: Record<string, unknown> }> =
                            [];
                        let after: string | null = null;
                        do {
                            const listed = await listPages.execute({
                                where: { latest: true },
                                sort: [],
                                limit: 100,
                                after
                            });
                            if (listed.isFail()) {
                                throw new Error(
                                    `The site's pages cannot be listed: ${listed.error.message}`
                                );
                            }
                            pages.push(...listed.value.pages);
                            after = listed.value.meta.hasMoreItems
                                ? listed.value.meta.cursor
                                : null;
                        } while (after);
                        const components = await listComponents.execute();
                        if (components.isFail()) {
                            throw new Error(
                                `The site's components cannot be listed: ${components.error.message}`
                            );
                        }
                        return siteInventory({
                            pages,
                            componentNames: components.value.items.map(item => item.name),
                            approvedNames
                        });
                    });
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocSiteResult",
        dependencies: [
            ComponentExtractionPermissions,
            SiteStore,
            TenantContext,
            GetTenantByIdUseCase,
            ListPagesUseCase,
            ListRemoteComponentsUseCase,
            ListFilesUseCase,
            RunRepository,
            StageArtifactStore
        ],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            sites: SiteStore.Interface,
            tenantContext: TenantContext.Interface,
            getTenantById: GetTenantByIdUseCase.Interface,
            listPages: ListPagesUseCase.Interface,
            listComponents: ListRemoteComponentsUseCase.Interface,
            listFiles: ListFilesUseCase.Interface,
            runs: RunRepository.Interface,
            artifacts: StageArtifactStore.Interface
        ) {
            return ({ args }: { args: { jobId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }
                    // The tenant comes from the job's site record, never from the caller.
                    const site = await sites.get(args.jobId);
                    if (!site?.lastBuild) {
                        return null;
                    }
                    const tenant = await getTenantById.execute(site.tenantId);
                    if (tenant.isFail()) {
                        throw new Error(`The site's tenant "${site.tenantId}" cannot be read.`);
                    }
                    /*
                     * In the extraction tenant first: the run the site was published from, what its
                     * components' prompts carried (Generate), and which Library id is which component
                     * (its approval into this tenant, and the site record's own map).
                     */
                    const run = await runs.get(site.lastBuild.runId);
                    const read = async <T>(stage: "generate" | "promote", name: string) => {
                        const ref = run.isOk()
                            ? stageEntry(run.value.stages, stage)?.artifacts?.[name]
                            : undefined;
                        const artifact = ref ? await artifacts.getJson<T>(ref) : null;
                        return artifact?.isOk() ? artifact.value : null;
                    };
                    const generate = await read<GenerateArtifact>("generate", "components");
                    const approval = await read<PromoteArtifact>("promote", "promotion");
                    const signatureById = new Map<string, string>([
                        ...(approval?.tenantId === site.tenantId
                            ? approval.promoted.map(
                                  item => [item.componentId, item.signature] as [string, string]
                              )
                            : []),
                        ...Object.entries(site.components ?? {}).map(
                            ([signature, id]) => [id, signature] as [string, string]
                        )
                    ]);
                    return tenantContext.withTenant(tenant.value, async () => {
                        const pages: Parameters<typeof siteResult>[0]["pages"] = [];
                        let after: string | null = null;
                        do {
                            const listed = await listPages.execute({
                                where: { latest: true },
                                sort: [],
                                limit: 100,
                                after
                            });
                            if (listed.isFail()) {
                                throw new Error(
                                    `The site's pages cannot be listed: ${listed.error.message}`
                                );
                            }
                            pages.push(...(listed.value.pages as never[]));
                            after = listed.value.meta.hasMoreItems
                                ? listed.value.meta.cursor
                                : null;
                        } while (after);
                        const components = await listComponents.execute();
                        if (components.isFail()) {
                            throw new Error(
                                `The site's components cannot be listed: ${components.error.message}`
                            );
                        }
                        const files: Array<{ key: string; type: string; size: number }> = [];
                        let fileCursor: string | null = null;
                        do {
                            const listed = await listFiles.execute({
                                limit: 500,
                                after: fileCursor
                            });
                            if (listed.isFail()) {
                                throw new Error(
                                    `The site's files cannot be listed: ${listed.error.message}`
                                );
                            }
                            files.push(
                                ...listed.value.items.map(file => ({
                                    key: file.key,
                                    type: file.type,
                                    size: file.size
                                }))
                            );
                            fileCursor = listed.value.meta.hasMoreItems
                                ? (listed.value.meta.cursor ?? null)
                                : null;
                        } while (fileCursor);
                        return {
                            runId: site.lastBuild!.runId,
                            sitemap: site.lastBuild!.qualities?.sitemap ?? null,
                            ...siteResult({
                                pages,
                                components: components.value.items.map(item => ({
                                    id: item.id,
                                    name: item.name
                                })),
                                files,
                                generated: (generate?.components ?? []).map(component => ({
                                    signature: component.signature,
                                    name: component.name,
                                    ...(component.qualityInstructions
                                        ? { qualityInstructions: component.qualityInstructions }
                                        : {})
                                })),
                                signatureById
                            })
                        };
                    });
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocPageMap",
        dependencies: [ComponentExtractionPermissions, PageMapStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            pageMaps: PageMapStore.Interface
        ) {
            return ({
                args
            }: {
                args: { runId: string; tenantId?: string | null; drafts?: boolean | null };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }

                    const result = await pageMaps.get(
                        args.runId,
                        args.tenantId ?? undefined,
                        args.drafts === true
                    );
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "Query.pageCompositionPocComposedCapture",
        dependencies: [ComponentExtractionPermissions, ComposedCaptureStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            captures: ComposedCaptureStore.Interface
        ) {
            return ({ args }: { args: { runId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canRead("componentExtraction"))) {
                        throw new Error("You do not have permission to read component extraction.");
                    }

                    const result = await captures.get(args.runId);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "Mutation.pageCompositionPocComposedUploadTargets",
        dependencies: [ComponentExtractionPermissions, RunRepository, PageMapStore, BlobStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            pageMaps: PageMapStore.Interface,
            blobs: BlobStore.Interface
        ) {
            return ({ args }: { args: { runId: string; paths: string[] } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }

                    // Resolved through the tenant-scoped repository, so a caller cannot obtain an
                    // upload URL under another tenant's run prefix.
                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }

                    const mapResult = await pageMaps.get(args.runId);
                    if (mapResult.isFail()) {
                        throw mapResult.error;
                    }
                    const map = mapResult.value;
                    if (!map) {
                        throw new Error(
                            "This run has not been composed, so there are no pages to photograph."
                        );
                    }

                    /*
                     * Keys are derived from the page's index in the map, not from the order the
                     * caller asked in. The index is what makes a slug collision impossible, and a
                     * caller that renamed or reordered its list must not be able to move a
                     * screenshot onto another page's key.
                     */
                    const indexByPath = new Map(map.pages.map((page, index) => [page.path, index]));

                    const targets = [];
                    for (const path of args.paths) {
                        const index = indexByPath.get(path);
                        if (index === undefined) {
                            throw new Error(`${path} is not a composed page of this run.`);
                        }

                        const signed = await blobs.signedUploadUrl(
                            composedScreenshotKey({
                                runId: args.runId,
                                composeVersion: map.composeVersion ?? 0,
                                index,
                                path
                            }),
                            "image/png",
                            UPLOAD_URL_SECONDS
                        );
                        if (signed.isFail()) {
                            throw signed.error;
                        }
                        targets.push({
                            path,
                            ref: signed.value.ref,
                            uploadUrl: signed.value.url,
                            contentType: signed.value.contentType
                        });
                    }

                    return { composeVersion: map.composeVersion ?? 0, targets };
                });
        }
    });

    builder.addResolver({
        path: "Mutation.pageCompositionPocRecordComposedCapture",
        dependencies: [ComponentExtractionPermissions, RunRepository, ComposedCaptureStore],
        resolver(
            permissions: ComponentExtractionPermissions.Interface,
            runRepository: RunRepository.Interface,
            captures: ComposedCaptureStore.Interface
        ) {
            return ({
                args
            }: {
                args: {
                    runId: string;
                    data: {
                        composeVersion: number;
                        capturedAt: string;
                        viewportWidth: number;
                        pages: ComposedCapturePage[];
                    };
                };
            }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("componentExtraction"))) {
                        throw new Error("You do not have permission to run component extraction.");
                    }

                    const runResult = await runRepository.get(args.runId);
                    if (runResult.isFail()) {
                        throw runResult.error;
                    }

                    const capture: ComposedCapture = {
                        runId: args.runId,
                        composeVersion: args.data.composeVersion,
                        capturedAt: args.data.capturedAt,
                        viewportWidth: args.data.viewportWidth,
                        /*
                         * Not taken from the caller. Every path that can write this record today is
                         * a developer running a script, and a field the caller could set would
                         * eventually claim otherwise. When a deployed capture exists it will set
                         * this itself, and that change should be visible in this file.
                         */
                        source: "local-harness",
                        pages: args.data.pages.map(page => ({
                            path: page.path,
                            status: page.status === "captured" ? "captured" : "skipped",
                            screenshotRef: page.screenshotRef || undefined,
                            reason: page.reason || undefined,
                            viewportWidth: page.viewportWidth ?? undefined
                        }))
                    };

                    const stored = await captures.set(capture);
                    if (stored.isFail()) {
                        throw stored.error;
                    }
                    return capture;
                });
        }
    });
};
