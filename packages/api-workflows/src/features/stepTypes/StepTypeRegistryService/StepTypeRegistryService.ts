import { StepType } from "~/features/stepTypes/StepType/abstractions.js";
import { StepTypeRegistryService as Abstraction } from "./abstractions.js";

class StepTypeRegistryServiceImpl implements Abstraction.Interface {
    private readonly stepTypes = new Map<string, StepType.Interface>();

    public constructor(stepTypes: StepType.Interface[]) {
        for (const stepType of stepTypes) {
            this.stepTypes.set(stepType.type, stepType);
        }
    }

    public get(type: string): StepType.Interface | null {
        return this.stepTypes.get(type) ?? null;
    }

    public list(): StepType.Interface[] {
        return [...this.stepTypes.values()];
    }
}

export const StepTypeRegistryService = Abstraction.createImplementation({
    implementation: StepTypeRegistryServiceImpl,
    dependencies: [[StepType, { multiple: true }]]
});
