import { type ChildProcess } from "node:child_process";

export interface IServerProcess {
    name: string;
    child: ChildProcess;
}

/**
 * Holds the long-running server process(es) a watch session started (e.g. the api HTTP server) for
 * the caller to render + await — the serve-side counterpart to `PackagesWatcher` in the watch
 * result. Unlike `PackagesWatcher` (which prepares processes the caller then runs), these are
 * already spawned, so this is a thin holder rather than a lifecycle manager.
 */
export class ServersWatcher {
    constructor(private processes: IServerProcess[]) {}

    getProcesses(): IServerProcess[] {
        return this.processes;
    }
}
