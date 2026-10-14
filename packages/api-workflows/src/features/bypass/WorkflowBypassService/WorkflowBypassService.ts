import { WorkflowBypassService as Abstraction } from "./abstractions.js";

class WorkflowBypassServiceImpl implements Abstraction.Interface {
    private active = false;

    public async run<T>(callback: () => Promise<T>): Promise<T> {
        const previous = this.active;
        this.active = true;
        try {
            return await callback();
        } finally {
            this.active = previous;
        }
    }

    public isActive(): boolean {
        return this.active;
    }
}

export const WorkflowBypassService = Abstraction.createImplementation({
    implementation: WorkflowBypassServiceImpl,
    dependencies: []
});
