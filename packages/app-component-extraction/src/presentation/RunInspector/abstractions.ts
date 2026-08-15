import { createAbstraction } from "@webiny/feature/admin";
import type { Stage } from "~/constants.js";
import type { JobDto, ModelCallDto, OverrideDto, ReattachmentDto, RunDto } from "~/shared/types.js";

export interface IRunInspectorVm {
    loading: boolean;
    error: string | null;
    run: RunDto | null;
    job: JobDto | null;
    modelCalls: ModelCallDto[];
    overrides: OverrideDto[];
    reattachments: ReattachmentDto[];
    /** Model-calls tab filter: "all" or a stage key. */
    modelStageFilter: string;
    /** Artifacts tab: the stage whose artifact JSON is shown, and the JSON itself. */
    selectedArtifactStage: Stage | null;
    artifactJson: string | null;
    artifactLoading: boolean;
}

export interface IRunInspectorPresenter {
    vm: IRunInspectorVm;
    init(runId: string): Promise<void>;
    setModelStageFilter(stage: string): void;
    selectArtifactStage(stage: Stage): Promise<void>;
}

export const RunInspectorPresenter = createAbstraction<IRunInspectorPresenter>(
    "ComponentExtraction/RunInspectorPresenter"
);

export namespace RunInspectorPresenter {
    export type Interface = IRunInspectorPresenter;
    export type ViewModel = IRunInspectorVm;
}
