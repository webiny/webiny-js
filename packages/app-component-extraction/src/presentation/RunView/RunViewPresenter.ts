import { makeAutoObservable, runInAction } from "mobx";
import { RunViewPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { currentStage, stageEntry } from "~/shared/ledger.js";
import type { RunDto, StageProgress } from "~/shared/types.js";

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
        logsStage: null
    };

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
            // Keep the open stage's log trail fresh while it is running.
            const stage = this.vm.selectedStage;
            if (stage && stageEntry(run, stage)?.status === "running") {
                await this.loadLogs(run, stage);
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
