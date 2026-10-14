import { makeAutoObservable, runInAction } from "mobx";
import { JobDetailPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { currentStage } from "~/shared/ledger.js";
import { STAGES, type Stage } from "~/constants.js";
import type { JobDto, OverrideDto, PromoteArtifactDto, RunDto } from "~/shared/types.js";

class JobDetailPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        error: null,
        job: null,
        runs: [],
        overrides: [],
        promoted: [],
        selectedStage: null,
        selectedRunIds: [],
        startingRun: false
    };

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable(this);
    }

    get currentRun(): RunDto | null {
        return this.vm.runs[0] ?? null;
    }

    async init(jobId: string) {
        runInAction(() => {
            this.vm.loading = true;
            this.vm.error = null;
        });
        await this.load(jobId, true);
    }

    /**
     * Reads the job and its runs again while a run is in flight, so the page keeps up without a reload.
     * Quiet: no loading state, and the stage picked in the rail stays picked.
     */
    async refresh() {
        const jobId = this.vm.job?.id;
        if (!jobId || this.vm.loading) {
            return;
        }
        await this.load(jobId, false);
    }

    /**
     * How often to read the run again, or null to stop. Often while a stage runs; slower while the run
     * is in flight with nothing running, which is both a run paused at a gate and the seconds between
     * one stage finishing and the next one it started marking itself running.
     */
    get pollInterval(): number | null {
        const run = this.currentRun;
        if (!run) {
            return null;
        }
        if (run.stages.some(entry => entry.status === "running")) {
            return 3000;
        }
        return run.status === "running" ? 10000 : null;
    }

    private async load(jobId: string, first: boolean) {
        try {
            const [job, runs, overrides] = await Promise.all([
                this.gateway.getJob(jobId),
                this.gateway.listRuns(jobId),
                this.gateway.listOverrides(jobId).catch(() => [] as OverrideDto[])
            ]);
            const current = runs[0] ?? null;
            // The promoted grid comes from the newest run's promote artifact, if it has produced one.
            let promoted: PromoteArtifactDto["promoted"] = [];
            if (current) {
                const promoteEntry = current.stages.find(entry => entry.stage === "promote");
                if (
                    promoteEntry &&
                    (promoteEntry.status === "done" || promoteEntry.status === "stale")
                ) {
                    const artifact = (await this.gateway
                        .getStageArtifact(current.id, "promote")
                        .catch(() => null)) as PromoteArtifactDto | null;
                    promoted = artifact?.promoted ?? [];
                }
            }
            runInAction(() => {
                this.vm.job = job;
                this.vm.runs = runs;
                this.vm.overrides = overrides;
                this.vm.promoted = promoted;
                if (first) {
                    this.vm.selectedStage = current
                        ? (currentStage(current) ?? STAGES[0])
                        : STAGES[0];
                }
                this.vm.loading = false;
            });
        } catch (error) {
            // A refresh that fails leaves the page as it was; the next one tries again.
            if (first) {
                runInAction(() => {
                    this.vm.error = (error as Error).message;
                    this.vm.loading = false;
                });
            }
        }
    }

    setJob(job: JobDto) {
        runInAction(() => {
            this.vm.job = job;
        });
    }

    selectStage(stage: Stage) {
        runInAction(() => {
            this.vm.selectedStage = stage;
        });
    }

    toggleRunSelection(runId: string) {
        runInAction(() => {
            this.vm.selectedRunIds = this.vm.selectedRunIds.includes(runId)
                ? this.vm.selectedRunIds.filter(id => id !== runId)
                : [...this.vm.selectedRunIds, runId];
        });
    }

    /**
     * A new run in place of one that is waiting at a gate or failed: a job runs one at a time, so the
     * current one is cancelled first. Its results stay readable in the run history.
     */
    async replaceRun(runId: string): Promise<string> {
        runInAction(() => {
            this.vm.startingRun = true;
            this.vm.error = null;
        });
        try {
            await this.gateway.cancelRun(runId);
        } catch (error) {
            runInAction(() => {
                this.vm.startingRun = false;
                this.vm.error = (error as Error).message;
            });
            throw error;
        }
        return this.startRun();
    }

    async startRun(): Promise<string> {
        const jobId = this.vm.job?.id;
        if (!jobId) {
            throw new Error("No job loaded.");
        }
        runInAction(() => {
            this.vm.startingRun = true;
            this.vm.error = null;
        });
        try {
            const run = await this.gateway.createRun(jobId);
            runInAction(() => {
                this.vm.startingRun = false;
            });
            return run.id;
        } catch (error) {
            runInAction(() => {
                this.vm.startingRun = false;
                this.vm.error = (error as Error).message;
            });
            throw error;
        }
    }
}

export const JobDetailPresenter = PresenterAbstraction.createImplementation({
    implementation: JobDetailPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
