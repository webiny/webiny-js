import { ShutdownSignal } from "~/domain/ShutdownSignal.js";

class ProcessShutdownSignalImpl implements ShutdownSignal.Interface {
    private shuttingDown = false;
    private readonly listeners = new Set<() => void>();

    public isShuttingDown(): boolean {
        return this.shuttingDown;
    }

    public onShutdown(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public begin(): void {
        if (this.shuttingDown) {
            return;
        }
        this.shuttingDown = true;
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
