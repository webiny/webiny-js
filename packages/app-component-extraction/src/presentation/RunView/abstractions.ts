import { createAbstraction } from "@webiny/feature/admin";
import type { JobDto, RunDto } from "~/shared/types.js";

export interface IRunViewVm {
    loading: boolean;
    run: RunDto | null;
    job: JobDto | null;
    error: string | null;
    /** The stage whose artifacts panel is open. */
    selectedStage: string | null;
    /** The stage currently being triggered, so its Run button can show a busy state. */
    actionStage: string | null;
}

export interface IRunViewPresenter {
    vm: IRunViewVm;
    init(runId: string): Promise<void>;
    refresh(): Promise<void>;
    runStage(stage: string): Promise<void>;
    selectStage(stage: string): void;
}

export const RunViewPresenter = createAbstraction<IRunViewPresenter>(
    "ComponentExtraction/RunViewPresenter"
);

export namespace RunViewPresenter {
    export type Interface = IRunViewPresenter;
    export type ViewModel = IRunViewVm;
}
