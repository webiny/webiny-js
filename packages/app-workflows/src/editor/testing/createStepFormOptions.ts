import { createEmptyStepFormOptions } from "~/editor/presentation/stepForm/createEmptyStepFormOptions.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";

// The options the drawer provides, all lists loaded and empty; override one section per test.
export const createStepFormOptions = (
    overrides: Partial<StepFormOptions> = {}
): StepFormOptions => {
    return { ...createEmptyStepFormOptions(), ...overrides };
};
