import { createAbstraction } from "@webiny/feature/api";
import type { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";

export interface IStepRunnerRegistryService {
    /**
     * The runner for this step type; `null` when none is registered. The last resolved
     * registration per `type` wins (instance registrations resolve before class registrations).
     */
    get(type: string): StepRunner.Interface | null;
}

/** The registered step runners (R168). */
export const StepRunnerRegistryService = createAbstraction<IStepRunnerRegistryService>(
    "StepRunnerRegistryService"
);

export namespace StepRunnerRegistryService {
    export type Interface = IStepRunnerRegistryService;
}
