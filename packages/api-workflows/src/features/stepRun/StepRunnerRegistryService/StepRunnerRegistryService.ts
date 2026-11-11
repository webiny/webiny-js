import { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";
import { StepRunnerRegistryService as Abstraction } from "./abstractions.js";

class StepRunnerRegistryServiceImpl implements Abstraction.Interface {
    private readonly runners = new Map<string, StepRunner.Interface>();

    public constructor(runners: StepRunner.Interface[]) {
        for (const runner of runners) {
            this.runners.set(runner.type, runner);
        }
    }

    public get(type: string): StepRunner.Interface | null {
        return this.runners.get(type) ?? null;
    }
}

export const StepRunnerRegistryService = Abstraction.createImplementation({
    implementation: StepRunnerRegistryServiceImpl,
    dependencies: [[StepRunner, { multiple: true }]]
});
