import { createAbstraction } from "@webiny/feature/admin";
import type { JobDto, RunDto, StageLogItem, StageProgress } from "~/shared/types.js";

export interface IRunViewVm {
    loading: boolean;
    run: RunDto | null;
    job: JobDto | null;
    error: string | null;
    /** The stage whose detail panel is open. */
    selectedStage: string | null;
    /** The stage currently being triggered, so its Run button can show a busy state. */
    actionStage: string | null;
    /** Live progress per stage, delivered over the websocket, keyed by stage name. */
    progressByStage: Record<string, StageProgress>;
    /** The selected stage's task log trail. */
    logs: StageLogItem[];
    logsLoading: boolean;
    /** Which stage `logs` belongs to, so the panel knows whether they're for the open stage. */
    logsStage: string | null;
}

export interface IRunViewPresenter {
    vm: IRunViewVm;
    init(runId: string): Promise<void>;
    refresh(): Promise<void>;
    runStage(stage: string): Promise<void>;
    selectStage(stage: string): void;
    /** Apply a live progress update pushed over the websocket for a stage. */
    applyProgress(stage: string, progress: StageProgress): void;
}

export const RunViewPresenter = createAbstraction<IRunViewPresenter>(
    "ComponentExtraction/RunViewPresenter"
);

export namespace RunViewPresenter {
    export type Interface = IRunViewPresenter;
    export type ViewModel = IRunViewVm;
}
