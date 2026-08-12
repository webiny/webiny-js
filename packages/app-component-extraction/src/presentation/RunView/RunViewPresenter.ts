import { makeAutoObservable, runInAction } from "mobx";
import { RunViewPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { currentStage } from "~/shared/ledger.js";

class RunViewPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        run: null,
        job: null,
        error: null,
        selectedStage: null,
        actionStage: null
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
            runInAction(() => {
                this.vm.run = run;
                this.vm.job = job;
                this.vm.loading = false;
                // Open the stage the run is currently at, falling back to the last stage once complete.
                this.vm.selectedStage =
                    currentStage(run) ?? run.stages[run.stages.length - 1]?.stage ?? null;
            });
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
        this.vm.selectedStage = stage;
    }
}

export const RunViewPresenter = PresenterAbstraction.createImplementation({
    implementation: RunViewPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
