import { createAbstraction } from "@webiny/feature/admin";
import type { Stage } from "~/constants.js";
import type { JobDto, OverrideDto, RunDto } from "~/shared/types.js";

export interface PromotedItem {
    signature: string;
    componentId: string;
    name: string;
}

export interface IJobDetailVm {
    loading: boolean;
    error: string | null;
    job: JobDto | null;
    runs: RunDto[];
    overrides: OverrideDto[];
    promoted: PromotedItem[];
    /** The stage selected in the rail, for the selected-stage summary. */
    selectedStage: Stage | null;
    /** Run ids ticked in run history; Compare is enabled only when exactly two are selected. */
    selectedRunIds: string[];
    startingRun: boolean;
}

export interface IJobDetailPresenter {
    vm: IJobDetailVm;
    /** The newest run (the "current run"), or null if the job has never run. */
    readonly currentRun: RunDto | null;
    init(jobId: string): Promise<void>;
    selectStage(stage: Stage): void;
    toggleRunSelection(runId: string): void;
    /** Starts a new run and returns its id. Throws on failure. */
    startRun(): Promise<string>;
}

export const JobDetailPresenter = createAbstraction<IJobDetailPresenter>(
    "ComponentExtraction/JobDetailPresenter"
);

export namespace JobDetailPresenter {
    export type Interface = IJobDetailPresenter;
    export type ViewModel = IJobDetailVm;
}
