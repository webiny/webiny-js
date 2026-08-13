import { makeAutoObservable, runInAction } from "mobx";
import { RunViewPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { currentStage, stageEntry } from "~/shared/ledger.js";
import type {
    DecisionsDto,
    GenerateArtifactDto,
    PlanArtifactDto,
    RenderArtifactDto,
    RunDto,
    StageProgress
} from "~/shared/types.js";

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
        regenerating: []
    };

    /** The task id whose logs are currently loaded, so a re-run (new task id) triggers a reload. */
    private loadedLogsTaskId: string | null = null;

    /** Pre-refine source per signature, so a completed regenerate is detected when the source changes. */
    private regenerateBaseline: Record<string, string> = {};

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
            const selected = currentStage(run) ?? run.stages[run.stages.length - 1]?.stage ?? null;
            runInAction(() => {
                this.vm.run = run;
                this.vm.job = job;
                this.vm.loading = false;
                // Open the stage the run is currently at, falling back to the last stage once complete.
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
        runInAction(() => {
            this.vm.actionStage = stage;
            this.vm.error = null;
            // A fresh run of the stage starts with a clean progress + log slate.
            delete this.vm.progressByStage[stage];
        });
        try {
            await this.gateway.runStage(runId, stage);
            // The stage now runs in the background; pick up its "running" status right away. Live
            // progress arrives over the websocket, with polling as the fallback.
            await this.refresh();
            runInAction(() => {
                this.vm.actionStage = null;
                this.vm.selectedStage = stage;
            });
        } catch (error) {
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
        const entry = stageEntry(run, stage);
        // No artifact before a stage has produced output; clear so the view shows the right empty state.
        if (!entry || (entry.status !== "done" && entry.status !== "stale")) {
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
