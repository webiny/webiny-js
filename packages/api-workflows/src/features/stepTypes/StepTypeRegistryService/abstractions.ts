import { createAbstraction } from "@webiny/feature/api";
import type { StepType } from "~/features/stepTypes/StepType/abstractions.js";

export interface IStepTypeRegistryService {
    /** The step type for `type`; `null` when none is registered. */
    get(type: string): StepType.Interface | null;
    /** Registration order; the last registration per `type` wins and keeps the first one's place. */
    list(): StepType.Interface[];
}

/** The registered step types (R131). */
export const StepTypeRegistryService =
    createAbstraction<IStepTypeRegistryService>("StepTypeRegistryService");

export namespace StepTypeRegistryService {
    export type Interface = IStepTypeRegistryService;
}
