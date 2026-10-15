import { createAbstraction } from "@webiny/feature/api";
import type { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";

export interface IStepRunnerRegistryService {
    /** The runner for this step type; `null` when none is registered. */
    get(type: string): StepRunner.Interface | null;
    /** Registration order; the last registration per `type` wins and keeps the first one's place. */
    list(): StepRunner.Interface[];
}

/** The registered step runners (R168). */
export const StepRunnerRegistryService = createAbstraction<IStepRunnerRegistryService>(
    "StepRunnerRegistryService"
);

export namespace StepRunnerRegistryService {
    export type Interface = IStepRunnerRegistryService;
}
