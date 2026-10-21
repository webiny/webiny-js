import { ShutdownSignal } from "~/domain/ShutdownSignal.js";

class ProcessShutdownSignalImpl implements ShutdownSignal.Interface {
    private stopping = false;
    private readonly listeners = new Set<() => void>();

    public isStopping(): boolean {
        return this.stopping;
    }

    public onStop(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public stop(): void {
        if (this.stopping) {
            return;
        }
        this.stopping = true;
        for (const listener of this.listeners) {
            listener();
        }
        this.listeners.clear();
    }
}

export const ProcessShutdownSignal = ShutdownSignal.createImplementation({
    implementation: ProcessShutdownSignalImpl,
    dependencies: []
});
