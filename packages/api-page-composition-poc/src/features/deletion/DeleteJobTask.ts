// Pulls in the `TaskController` augmentation so `controller.response`/`logger` exist.
import "@webiny/background-tasks/api/types.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { runLockKey } from "@webiny/api-component-extraction/constants.js";
import { JobDataEraser } from "@webiny/api-component-extraction/features/deletion/JobDataEraser.js";
import { DeletePageUseCase } from "@webiny/api-website-builder/features/pages/DeletePage/abstractions.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetPageById/index.js";
import { GetDeletedPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetDeletedPageById/index.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { DeleteRemoteComponentUseCase } from "@webiny/remote-components/api/features/deleteComponent/abstractions.js";
import { ListThemesUseCase } from "@webiny/api-theme/features/ListThemes/index.js";
import { DeleteThemeUseCase } from "@webiny/api-theme/features/DeleteTheme/index.js";
import { DELETE_JOB_TASK_ID, composedCaptureKey, pageMapKey, siteKey } from "~/constants.js";
import { JobDeletionReader } from "./JobDeletionReader.js";
import { SiteTenantEraser } from "./SiteTenantEraser.js";
import {
    type JobDeletionPlan,
    type JobDeletionRecord,
    type JobDeletionStep,
    type JobDeletionStepRecord,
    JobDeletionStore
} from "./JobDeletionStore.js";

export interface DeleteJobTaskInput {
    jobId: string;
    mode: "plan" | "delete";
    /** Delete the job's site with it. Required when the site is live. */
    includeSite?: boolean;
    /** The plan the person confirmed, by when it was computed; a delete stops if what it finds differs. */
    confirmedPlanOn?: string;
}

/**
 * The counts a person confirms, as one comparable string. If the delete finds anything different
 * from what was shown, it stops rather than delete a number nobody agreed to.
 */
export const planSummary = (plan: JobDeletionPlan): string =>
    JSON.stringify({
        runs: plan.runs,
        modelCalls: plan.modelCalls,
        pages: plan.root.pages.ids.length,
        components: plan.root.components.delete.length,
        images: plan.root.images.delete.length,
        referenceImages: plan.root.referenceFileIds.length,
        theme: plan.root.theme.delete,
        site: plan.site
            ? [
                  plan.site.tenantId,
                  plan.site.exists,
                  plan.site.pages,
                  plan.site.components,
                  plan.site.files,
                  plan.site.themes
              ]
            : null
    });

/** The refusal a live site gets when the person did not choose to delete it. */
export const LIVE_SITE_REFUSAL =
    "This job's site is live. Delete the site with it, or keep the job.";

/** Whether the site goes: when it is live, only if the person chose so; otherwise always. */
export const siteGoes = (plan: JobDeletionPlan, includeSite: boolean): boolean =>
    Boolean(plan.site) && (includeSite || !plan.site!.live);

class DeleteJobTaskHandlerImpl implements TaskHandler.Interface<DeleteJobTaskInput> {
    constructor(
        private reader: JobDeletionReader.Interface,
        private records: JobDeletionStore.Interface,
        private eraser: JobDataEraser.Interface,
        private siteEraser: SiteTenantEraser.Interface,
        private store: KeyValueStore.Interface,
        private deletePage: DeletePageUseCase.Interface,
        private getPage: GetPageByIdUseCase.Interface,
        private getDeletedPage: GetDeletedPageByIdUseCase.Interface,
        private listComponents: ListRemoteComponentsUseCase.Interface,
        private deleteComponent: DeleteRemoteComponentUseCase.Interface,
        private listThemes: ListThemesUseCase.Interface,
        private deleteTheme: DeleteThemeUseCase.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<DeleteJobTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }
        const taskId = controller.state.getTask().id;
        const existing = await this.records.get(input.jobId);

        if (input.mode === "plan") {
            const read = await this.reader.read(input.jobId);
            const record: JobDeletionRecord = {
                jobId: input.jobId,
                jobName: typeof read === "string" ? (existing?.jobName ?? "") : read.job.name,
                plan:
                    typeof read === "string"
                        ? {
                              status: "failed",
                              taskId,
                              startedOn: existing?.plan.startedOn ?? new Date().toISOString(),
                              error: read
                          }
                        : {
                              status: "done",
                              taskId,
                              startedOn: existing?.plan.startedOn ?? new Date().toISOString(),
                              result: read.plan
                          },
                ...(existing?.deletion ? { deletion: existing.deletion } : {})
            };
            await this.records.set(record);
            return typeof read === "string"
                ? controller.response.error(read)
                : controller.response.done("Counted what deleting the job removes.");
        }

        // ---- Delete. ----------------------------------------------------------------------------
        const includeSite = input.includeSite === true;
        const record: JobDeletionRecord = existing ?? {
            jobId: input.jobId,
            jobName: "",
            plan: { status: "running", startedOn: new Date().toISOString() }
        };
        const deletion: NonNullable<JobDeletionRecord["deletion"]> = {
            status: "running",
            taskId,
            includeSite,
            startedOn: new Date().toISOString(),
            steps: []
        };
        record.deletion = deletion;

        const save = () => this.records.set(record);
        const step = async (
            name: JobDeletionStep,
            status: JobDeletionStepRecord["status"],
            detail: string
        ) => {
            deletion.steps = [
                ...deletion.steps.filter(item => item.step !== name),
                { step: name, status, detail, at: new Date().toISOString() }
            ];
            await save();
            await controller.logger.info({ message: `${name}: ${detail}` });
        };
        const stop = async (name: JobDeletionStep, message: string) => {
            await step(name, "failed", message);
            deletion.status = "failed";
            deletion.error = message;
            deletion.finishedOn = new Date().toISOString();
            await save();
            await this.releaseLock(input.jobId, taskId);
            return controller.response.error(`${name}: ${message}`);
        };
        await save();

        // ---- 1. Check: read everything again; act only on what was shown. ----------------------
        await step("check", "running", "Counting what the delete removes, again.");
        const read = await this.reader.read(input.jobId);
        if (typeof read === "string") {
            return stop("check", read);
        }
        const { plan, runs, job } = read;
        record.jobName = job.name;
        const shown = record.plan.result;
        if (
            !shown ||
            (input.confirmedPlanOn && shown.computedOn !== input.confirmedPlanOn) ||
            planSummary(shown) !== planSummary(plan)
        ) {
            record.plan = {
                status: "done",
                taskId,
                startedOn: new Date().toISOString(),
                result: plan
            };
            return stop(
                "check",
                "What the delete would remove changed since it was shown. Review the new counts and confirm again."
            );
        }
        if (plan.blocked) {
            return stop("check", plan.blocked);
        }
        if (plan.site?.live && !includeSite) {
            return stop("check", LIVE_SITE_REFUSAL);
        }
        // Hold the job's run slot, so no run starts on a job being deleted.
        await this.store.set(runLockKey(job.id), `deleting:${taskId}`);
        await step("check", "done", "The counts match what was shown.");

        // ---- 2. The site: its content, each kind checked empty, then the tenant. ---------------
        if (plan.site && siteGoes(plan, includeSite)) {
            const tenant = plan.site.exists ? await this.siteEraser.find(plan.site.tenantId) : null;
            if (tenant) {
                await step("site-content", "running", `Deleting the content of ${tenant.id}.`);
                const erased = await this.siteEraser.eraseContent(tenant, detail =>
                    step("site-content", "running", detail)
                );
                if (typeof erased === "string") {
                    // Stopped before the tenant: it can still be reached, and the delete retried.
                    return stop("site-content", erased);
                }
                await step(
                    "site-content",
                    "done",
                    `Deleted ${erased.pages} page(s), ${erased.components} component(s), ${erased.files} file(s) and ${erased.themes} theme(s).`
                );
                await step("site-tenant", "running", `Deleting tenant ${tenant.id}.`);
                const gone = await this.siteEraser.eraseTenant(tenant.id);
                if (gone !== true) {
                    return stop("site-tenant", gone);
                }
                await step("site-tenant", "done", `Tenant ${tenant.id} is gone.`);
            } else {
                await step("site-tenant", "skipped", "The site's tenant was already gone.");
            }
        }

        // ---- 3. Root: pages, then the components they named, then files and the theme. --------
        const pageIds = plan.root.pages.ids;
        for (const id of pageIds) {
            await this.deletePage.execute({ id });
        }
        const pagesLeft: string[] = [];
        for (const id of pageIds) {
            const [live, binned] = await Promise.all([
                this.getPage.execute(id),
                this.getDeletedPage.execute(id)
            ]);
            if (live.isOk() || binned.isOk()) {
                pagesLeft.push(id);
            }
        }
        if (pagesLeft.length > 0) {
            return stop(
                "pages",
                `${pagesLeft.length} of ${pageIds.length} root page(s) are still there, first ${pagesLeft[0]}.`
            );
        }
        await step("pages", "done", `Deleted ${pageIds.length} root page(s).`);

        const componentIds = plan.root.components.delete.map(component => component.id);
        for (const id of componentIds) {
            await this.deleteComponent.execute(id);
        }
        const listed = await this.listComponents.execute();
        if (listed.isFail()) {
            return stop("components", `Could not list root's components to check them.`);
        }
        const stillListed = new Set(listed.value.items.map(item => item.id));
        const componentsLeft = componentIds.filter(id => stillListed.has(id));
        if (componentsLeft.length > 0) {
            return stop(
                "components",
                `${componentsLeft.length} of ${componentIds.length} component(s) are still in root's Library.`
            );
        }
        await step("components", "done", `Deleted ${componentIds.length} component(s).`);

        const images = await this.eraser.eraseImages(plan.root.images.delete);
        if (images.isFail()) {
            return stop("images", images.error.message);
        }
        await step(
            "images",
            "done",
            `Deleted ${images.value} image(s); ${plan.root.images.keptShared} used by other jobs stay.`
        );

        const references = await this.eraser.eraseFiles(plan.root.referenceFileIds);
        if (references.isFail()) {
            return stop("reference-images", references.error.message);
        }
        await step("reference-images", "done", `Deleted ${references.value} reference image(s).`);

        if (plan.root.theme.delete) {
            const themeId = await this.themeRevision(plan.root.theme.delete);
            if (themeId) {
                const deleted = await this.deleteTheme.execute({ id: themeId });
                if (deleted.isFail()) {
                    return stop("theme", `Could not delete the theme: ${deleted.error.message}`);
                }
            }
            if (await this.themeRevision(plan.root.theme.delete)) {
                return stop("theme", "The theme is still there after it was deleted.");
            }
            await step("theme", "done", "Deleted the theme this job extracted.");
        } else {
            await step("theme", "skipped", plan.root.theme.kept ?? "The job has no theme.");
        }

        // ---- 4. The runs, then the job and its records. ----------------------------------------
        for (const { run, signatures } of runs) {
            const erased = await this.eraser.eraseRun({
                id: run.id,
                entryId: run.entryId,
                stages: run.stages,
                signatures
            });
            if (erased.isFail()) {
                return stop("runs", `Run ${run.runNumber}: ${erased.error.message}`);
            }
            for (const key of [
                pageMapKey(run.id),
                `${pageMapKey(run.id)}:drafts`,
                ...(plan.site
                    ? [
                          pageMapKey(run.id, plan.site.tenantId),
                          `${pageMapKey(run.id, plan.site.tenantId)}:drafts`
                      ]
                    : []),
                composedCaptureKey(run.id)
            ]) {
                await this.store.delete(key);
            }
            await step("runs", "running", `Deleted run ${run.runNumber}.`);
        }
        await step("runs", "done", `Deleted ${runs.length} run(s) and their records.`);

        if (plan.site && siteGoes(plan, includeSite)) {
            await this.store.delete(siteKey(job.id));
        }
        const erasedJob = await this.eraser.eraseJob({ id: job.id, entryId: job.entryId });
        if (erasedJob.isFail()) {
            return stop("job", erasedJob.error.message);
        }
        await step("job", "done", `Deleted the job "${job.name}".`);

        deletion.status = "done";
        deletion.finishedOn = new Date().toISOString();
        await save();
        return controller.response.done(`Deleted the job "${job.name}".`);
    }

    /** The theme's current revision id, or null when no theme with that entry id is left. */
    private async themeRevision(entryId: string): Promise<string | null> {
        let after: string | null = null;
        do {
            const listed = await this.listThemes.execute({ limit: 100, after });
            if (listed.isFail()) {
                return null;
            }
            const found = listed.value.themes.find(theme => theme.entryId === entryId);
            if (found) {
                return found.id;
            }
            after = listed.value.meta.hasMoreItems ? (listed.value.meta.cursor ?? null) : null;
        } while (after);
        return null;
    }

    /** Free the run slot this delete held, and only that. */
    private async releaseLock(jobId: string, taskId: string): Promise<void> {
        const held = await this.store.get<string>(runLockKey(jobId));
        if (held.isOk() && held.value === `deleting:${taskId}`) {
            await this.store.delete(runLockKey(jobId));
        }
    }
}

const DeleteJobTaskHandler = TaskHandler.createImplementation({
    implementation: DeleteJobTaskHandlerImpl,
    dependencies: [
        JobDeletionReader,
        JobDeletionStore,
        JobDataEraser,
        SiteTenantEraser,
        KeyValueStore,
        DeletePageUseCase,
        GetPageByIdUseCase,
        GetDeletedPageByIdUseCase,
        ListRemoteComponentsUseCase,
        DeleteRemoteComponentUseCase,
        ListThemesUseCase,
        DeleteThemeUseCase
    ]
});

class DeleteJobTaskImpl implements TaskDefinition.Interface<DeleteJobTaskInput> {
    readonly id = DELETE_JOB_TASK_ID;
    readonly title = "Component extraction — delete a job";
    readonly description =
        "Counts what deleting a job removes after the sharing checks, or deletes it: the site's content and tenant if chosen, then the job's pages, components, images and theme in root, then its runs and the job.";
    readonly maxIterations = 1;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = DeleteJobTaskHandler;
}

export const DeleteJobTask = TaskDefinition.createImplementation({
    implementation: DeleteJobTaskImpl,
    dependencies: []
});
