import { makeAutoObservable, runInAction } from "mobx";
import { RunInspectorPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import type { Stage } from "~/constants.js";
import type { ModelCallDto, OverrideDto, ReattachmentDto } from "~/shared/types.js";

class RunInspectorPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        error: null,
        run: null,
        job: null,
        modelCalls: [],
        overrides: [],
        reattachments: [],
        modelStageFilter: "all",
        selectedArtifactStage: null,
        artifactJson: null,
        artifactLoading: false
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
            const [job, modelCalls, overrides, reattachments] = await Promise.all([
                this.gateway.getJob(run.jobId),
                this.gateway.listModelCalls(runId).catch(() => [] as ModelCallDto[]),
                this.gateway.listOverrides(run.jobId).catch(() => [] as OverrideDto[]),
                this.gateway.getReattachments(runId).catch(() => [] as ReattachmentDto[])
            ]);
            runInAction(() => {
                this.vm.run = run;
                this.vm.job = job;
                this.vm.modelCalls = (modelCalls as ModelCallDto[]) ?? [];
                this.vm.overrides = overrides as OverrideDto[];
                this.vm.reattachments = (reattachments as ReattachmentDto[]) ?? [];
                this.vm.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
                this.vm.loading = false;
            });
        }
    }

    setModelStageFilter(stage: string) {
        runInAction(() => {
            this.vm.modelStageFilter = stage;
        });
    }

    async selectArtifactStage(stage: Stage) {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        runInAction(() => {
            this.vm.selectedArtifactStage = stage;
            this.vm.artifactLoading = true;
            this.vm.artifactJson = null;
        });
        try {
            const artifact = await this.gateway.getStageArtifact(runId, stage);
            runInAction(() => {
                this.vm.artifactJson = artifact ? JSON.stringify(artifact, null, 2) : null;
                this.vm.artifactLoading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.vm.artifactJson = `// Could not load: ${(error as Error).message}`;
                this.vm.artifactLoading = false;
            });
        }
    }
}

export const RunInspectorPresenter = PresenterAbstraction.createImplementation({
    implementation: RunInspectorPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
