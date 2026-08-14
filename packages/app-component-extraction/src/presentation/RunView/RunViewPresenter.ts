import { makeAutoObservable, runInAction } from "mobx";
import { RunViewPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { stageEntry } from "~/shared/ledger.js";
import type {
    DecisionsDto,
    GenerateArtifactDto,
    ModelCallDto,
    PlanArtifactDto,
    PlanCostProjectionDto,
    RenderArtifactDto,
    RunDto,
    StageProgress
} from "~/shared/types.js";

// How long to hold the optimistic "starting" indication before giving up on it. A stage marks itself
// running within a few seconds of its task starting; if the ledger hasn't reflected the trigger by now
// the task did not take (e.g. it never ran), so drop the indication and show the real status rather than
// hang on "starting" forever.
const STARTING_TIMEOUT_MS = 30000;

class RunViewPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        run: null,
        job: null,
        error: null,
        selectedStage: null,
        actionStage: null,
        progressByStage: {},
        logs: [],
        logsLoading: false,
        logsStage: null,
        artifact: null,
        artifactStage: null,
        artifactLoading: false,
        renders: null,
        rendering: false,
        decisions: {},
        sourceCrops: {},
        regenerating: [],
        showTokens: false,
        modelCalls: null,
        modelCallsLoading: false,
        planProjection: null
    };

    /** The task id whose logs are currently loaded, so a re-run (new task id) triggers a reload. */
    private loadedLogsTaskId: string | null = null;

    /** Pre-refine source per signature, so a completed regenerate is detected when the source changes. */
    private regenerateBaseline: Record<string, string> = {};

    /** Task id of the stage the operator just triggered, to keep a "starting" indication until it runs. */
    private pendingActionTaskId: string | null = null;

    /** When the current "starting" indication began, so it can't hang if the task never progresses. */
    private pendingActionSince: number | null = null;

    /** `stage:stageVersion` of the loaded artifact, so a re-run to a new version refetches it. */
    private loadedArtifactKey: string | null = null;

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable(this);
    }

    async init(runId: string) {
        runInAction(() => {
            this.vm.loading = true;
            this.vm.error = null;
        });

        try {
            const run = await this.gateway.getRun(runId);
            const job = await this.gateway.getJob(run.jobId);
            // Open the most-recently-active stage: whatever is running, else the last stage that has
            // actually run (has a task id). This keeps a completed/running stage — and its activity
            // trail — in view across a reload, instead of jumping ahead to the next pending stage (which
            // has no logs and looks like the trail was lost).
            const running = run.stages.find(entry => entry.status === "running");
            const lastRun = [...run.stages].reverse().find(entry => entry.taskId);
            const selected = running?.stage ?? lastRun?.stage ?? run.stages[0]?.stage ?? null;
            runInAction(() => {
                this.vm.run = run;
                this.vm.job = job;
                this.vm.loading = false;
                this.vm.selectedStage = selected;
            });
            if (selected) {
                await this.loadLogs(run, selected);
                await this.loadArtifact(run, selected);
            }
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
                this.vm.loading = false;
            });
        }
    }

    async refresh() {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            const run = await this.gateway.getRun(runId);
            runInAction(() => {
                this.vm.run = run;
            });
            // Clear the "starting" indication once the triggered stage has picked up its task (the task
            // stamps its id and marks the stage running/failed). The task-id match also covers a stage
            // that ran to completion between polls, where "running" was never observed. And, so it can't
            // hang, drop it after a timeout — e.g. a re-run of a done stage whose task never ran keeps
            // the ledger at its old "done", which would otherwise leave "starting" stuck until reload.
            if (this.vm.actionStage) {
                const entry = stageEntry(run, this.vm.actionStage);
                const confirmed =
                    !!entry &&
                    ((this.pendingActionTaskId !== null &&
                        entry.taskId === this.pendingActionTaskId) ||
                        entry.status === "running" ||
                        entry.status === "failed");
                const timedOut =
                    this.pendingActionSince !== null &&
                    Date.now() - this.pendingActionSince > STARTING_TIMEOUT_MS;
                if (confirmed || timedOut) {
                    this.pendingActionTaskId = null;
                    this.pendingActionSince = null;
                    runInAction(() => {
                        this.vm.actionStage = null;
                    });
                }
            }
            // Reload the open stage's trail while it runs (live), and whenever its task id changes —
            // a re-run mints a new task, so the old task's trail must be replaced.
            const stage = this.vm.selectedStage;
            if (stage) {
                const entry = stageEntry(run, stage);
                if (
                    entry &&
                    (entry.status === "running" || entry.taskId !== this.loadedLogsTaskId)
                ) {
                    await this.loadLogs(run, stage);
                }
                // Refetch the artifact when the open stage advances to a new version — a re-run writes
                // its screenshots/crops under new keys, so a stale artifact would keep showing the old
                // images even after the re-run completes.
                if (entry && (entry.status === "done" || entry.status === "stale")) {
                    const key = `${stage}:${entry.stageVersion}`;
                    if (key !== this.loadedArtifactKey) {
                        await this.loadArtifact(run, stage);
                    }
                }
                // While a render pass is in flight, poll its results so thumbnails appear when ready.
                if (stage === "generate" && this.vm.rendering) {
                    await this.loadRenders(run);
                }
                // While a regenerate is in flight, poll the artifact so the refined component lands.
                if (stage === "generate" && this.vm.regenerating.length > 0) {
                    await this.pollRegenerations(run);
                }
            }
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async runStage(stage: string) {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        this.pendingActionSince = Date.now();
        runInAction(() => {
            this.vm.actionStage = stage;
            this.vm.error = null;
            // A fresh run of the stage starts with a clean progress + log slate.
            delete this.vm.progressByStage[stage];
        });
        try {
            const result = await this.gateway.runStage(runId, stage);
            // Keep `actionStage` set (the "starting" indication) — it is NOT cleared here. There's a gap
            // between triggering the task and the task marking the stage "running", and clearing now would
            // drop the stage back to a plain "pending" look during that gap. refresh() clears it once the
            // ledger shows the stage picked up this task (or reached running).
            this.pendingActionTaskId = result.taskId;
            runInAction(() => {
                this.vm.selectedStage = stage;
            });
            await this.refresh();
        } catch (error) {
            this.pendingActionTaskId = null;
            this.pendingActionSince = null;
            runInAction(() => {
                this.vm.actionStage = null;
                this.vm.error = (error as Error).message;
            });
        }
    }

    selectStage(stage: string) {
        runInAction(() => {
            this.vm.selectedStage = stage;
        });
        if (this.vm.run) {
            void this.loadLogs(this.vm.run, stage);
            void this.loadArtifact(this.vm.run, stage);
        }
    }

    async updateDiscoverUrls(urls: Array<{ url: string; group?: string }>): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            const run = await this.gateway.updateDiscoverUrls(runId, urls);
            runInAction(() => {
                this.vm.run = run;
            });
            await this.loadArtifact(run, "discover");
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async excludeCapturedPages(urls: string[]): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId || urls.length === 0) {
            return;
        }
        try {
            const run = await this.gateway.excludeCapturedPages(runId, urls);
            runInAction(() => {
                this.vm.run = run;
            });
            await this.loadArtifact(run, "capture");
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async renderComponents(): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        runInAction(() => {
            this.vm.rendering = true;
            this.vm.error = null;
        });
        try {
            await this.gateway.renderComponents(runId);
        } catch (error) {
            runInAction(() => {
                this.vm.rendering = false;
                this.vm.error = (error as Error).message;
            });
        }
    }

    async setDecision(signature: string, decision: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            const updated = (await this.gateway.setComponentDecision(
                runId,
                signature,
                decision
            )) as DecisionsDto | null;
            runInAction(() => {
                this.vm.decisions = updated?.decisions ?? {};
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async regenerateComponent(signature: string, instruction: string): Promise<void> {
        const runId = this.vm.run?.id;
        const trimmed = instruction.trim();
        if (!runId || !trimmed) {
            return;
        }
        // Remember the current source so the refresh loop can tell when the refined version lands.
        const artifact = this.vm.artifact as GenerateArtifactDto | null;
        const current = artifact?.components.find(component => component.signature === signature);
        this.regenerateBaseline[signature] = current?.source ?? "";
        runInAction(() => {
            this.vm.regenerating = [...new Set([...this.vm.regenerating, signature])];
            this.vm.error = null;
        });
        try {
            await this.gateway.regenerateComponent(runId, signature, trimmed);
        } catch (error) {
            runInAction(() => {
                this.vm.regenerating = this.vm.regenerating.filter(item => item !== signature);
                this.vm.error = (error as Error).message;
            });
        }
    }

    /**
     * While a regenerate is in flight, reload the Generate artifact and clear each signature whose source
     * has changed — the refine task replaces the component in place, so a changed source means it's done.
     */
    private async pollRegenerations(run: RunDto): Promise<void> {
        await this.loadArtifact(run, "generate");
        const artifact = this.vm.artifact as GenerateArtifactDto | null;
        const stillRunning = this.vm.regenerating.filter(signature => {
            const component = artifact?.components.find(item => item.signature === signature);
            return !component || component.source === this.regenerateBaseline[signature];
        });
        if (stillRunning.length !== this.vm.regenerating.length) {
            runInAction(() => {
                this.vm.regenerating = stillRunning;
            });
        }
    }

    toggleTokens(): void {
        const opening = !this.vm.showTokens;
        runInAction(() => {
            this.vm.showTokens = opening;
        });
        if (opening && this.vm.run && this.vm.modelCalls === null) {
            void this.loadModelCalls(this.vm.run);
        }
    }

    /** Load a run's individual model calls for the token panel. */
    private async loadModelCalls(run: RunDto): Promise<void> {
        runInAction(() => {
            this.vm.modelCallsLoading = true;
        });
        try {
            const calls = (await this.gateway.listModelCalls(run.id)) as ModelCallDto[] | null;
            runInAction(() => {
                this.vm.modelCalls = calls ?? [];
                this.vm.modelCallsLoading = false;
            });
        } catch {
            runInAction(() => {
                this.vm.modelCalls = [];
                this.vm.modelCallsLoading = false;
            });
        }
    }

    /** Load the Plan-gate cost projection when the Plan stage is open. */
    private async loadPlanProjection(run: RunDto): Promise<void> {
        try {
            const projection = (await this.gateway.projectPlanCost(
                run.id
            )) as PlanCostProjectionDto | null;
            runInAction(() => {
                this.vm.planProjection = projection;
            });
        } catch {
            runInAction(() => {
                this.vm.planProjection = null;
            });
        }
    }

    /** Load the accept/reject decisions and the source crop refs the Generate view pairs with renders. */
    private async loadGenerateExtras(run: RunDto): Promise<void> {
        try {
            const [decisions, plan] = await Promise.all([
                this.gateway.getDecisions(run.id) as Promise<DecisionsDto | null>,
                this.gateway.getStageArtifact(run.id, "plan") as Promise<PlanArtifactDto | null>
            ]);
            const sourceCrops: Record<string, string> = {};
            for (const planned of plan?.components ?? []) {
                sourceCrops[planned.signature] = planned.representativeCrop.cropRef;
            }
            runInAction(() => {
                this.vm.decisions = decisions?.decisions ?? {};
                this.vm.sourceCrops = sourceCrops;
            });
        } catch {
            // The comparison still renders without the source crop or a prior decision.
        }
    }

    /** Load the run's rendered-component screenshots, if the render pass has produced them. */
    private async loadRenders(run: RunDto): Promise<void> {
        try {
            const artifact = (await this.gateway.getRenders(run.id)) as RenderArtifactDto | null;
            runInAction(() => {
                this.vm.renders = artifact?.renders ?? null;
                // The artifact is written when the pass completes, so its arrival clears "rendering".
                if (artifact?.renders) {
                    this.vm.rendering = false;
                }
            });
        } catch {
            // A missing render artifact is the normal "not rendered yet" state, not an error to surface.
        }
    }

    /** Load the selected stage's structured artifact for its visibility view. */
    private async loadArtifact(run: RunDto, stage: string) {
        // Switching stages: drop the previous stage's artifact immediately. Otherwise a shape-specific
        // view (e.g. Plan expects `components`, Cluster `clusters`) can render against the wrong stage's
        // artifact during the async load and crash on a missing field.
        if (this.vm.artifactStage !== stage) {
            this.loadedArtifactKey = null;
            runInAction(() => {
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
            });
        }
        const entry = stageEntry(run, stage);
        // No artifact before a stage has produced output; clear so the view shows the right empty state.
        if (!entry || (entry.status !== "done" && entry.status !== "stale")) {
            this.loadedArtifactKey = null;
            runInAction(() => {
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
                this.vm.artifactLoading = false;
            });
            return;
        }
        runInAction(() => {
            this.vm.artifactLoading = true;
        });
        try {
            const artifact = await this.gateway.getStageArtifact(run.id, stage);
            // Tag the loaded artifact with the stage version it came from, so a later re-run to a new
            // version (whose artifacts — screenshots, crops — live under new keys) is refetched.
            this.loadedArtifactKey = `${stage}:${entry.stageVersion}`;
            runInAction(() => {
                this.vm.artifact = artifact;
                this.vm.artifactStage = stage;
                this.vm.artifactLoading = false;
            });
            // The Generate view pairs each component with its rendered screenshot (W7.7), its source
            // crop and the operator's accept/reject decisions (W7.8).
            if (stage === "generate") {
                void this.loadRenders(run);
                void this.loadGenerateExtras(run);
            }
            // The Plan gate shows the projected generation cost before approval (W7.9).
            if (stage === "plan") {
                void this.loadPlanProjection(run);
            }
        } catch {
            runInAction(() => {
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
                this.vm.artifactLoading = false;
            });
        }
    }

    applyProgress(stage: string, progress: StageProgress) {
        runInAction(() => {
            this.vm.progressByStage[stage] = progress;
            // Live-append to the visible trail when this is the open stage; the poll's fetch from the
            // task output later replaces it with the authoritative list, healing any gaps.
            if (this.vm.logsStage === stage) {
                this.vm.logs = [
                    ...this.vm.logs,
                    { message: progress.message, type: "info", createdOn: new Date().toISOString() }
                ].slice(-100);
            }
        });
    }

    /** Load the task log trail for a stage, if it has a task id yet. */
    private async loadLogs(run: RunDto, stage: string) {
        const taskId = stageEntry(run, stage)?.taskId ?? null;
        this.loadedLogsTaskId = taskId;
        if (!taskId) {
            runInAction(() => {
                this.vm.logs = [];
                this.vm.logsStage = stage;
            });
            return;
        }
        runInAction(() => {
            this.vm.logsLoading = true;
        });
        try {
            const logs = await this.gateway.listStageLogs(taskId);
            runInAction(() => {
                this.vm.logs = logs;
                this.vm.logsStage = stage;
                this.vm.logsLoading = false;
            });
        } catch (error) {
            // A log-fetch failure must not disrupt the run view; leave whatever was there, but surface
            // it to the console so a broken query isn't silently invisible.
            console.warn("[component-extraction] Could not load stage logs:", error);
            runInAction(() => {
                this.vm.logsLoading = false;
            });
        }
    }
}

export const RunViewPresenter = PresenterAbstraction.createImplementation({
    implementation: RunViewPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
