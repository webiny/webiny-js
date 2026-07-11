import { type ChildProcess } from "node:child_process";

/**
 * A server process the project layer knows how to spawn (port resolution, runner, env), but does NOT
 * spawn until the caller runs it — the serve-side counterpart to a build watcher process. `spawn` is
 * flavour-provided and lazy so nothing binds a port until `run()` is called.
 */
export interface IServerProcessSpec {
    name: string;
    spawn: () => Promise<ChildProcess>;
}

/**
 * Lazy, runnable server process mirroring `RunnableWatchProcess`: the caller attaches output via
 * `pipeStdout`/`pipeStderr`, then `run()` spawns it and resolves when it exits. Keeps rendering +
 * lifecycle with the caller (e.g. the CLI).
 */
export class RunnableServerProcess {
    readonly name: string;
    private spawnFn: () => Promise<ChildProcess>;
    private pipeStdoutCallback: ((stdout: NodeJS.ReadableStream) => void) | undefined;
    private pipeStderrCallback: ((stderr: NodeJS.ReadableStream) => void) | undefined;

    constructor(spec: IServerProcessSpec) {
        this.name = spec.name;
        this.spawnFn = spec.spawn;
    }

    async run(): Promise<void> {
        const child = await this.spawnFn();

        if (this.pipeStdoutCallback && child.stdout) {
            this.pipeStdoutCallback(child.stdout);
        }
        if (this.pipeStderrCallback && child.stderr) {
            this.pipeStderrCallback(child.stderr);
        }

        return new Promise<void>((resolve, reject) => {
            child.on("error", reject);
            child.on("exit", code => {
                // A clean exit or a signal-initiated shutdown (code === null) is not an error.
                if (code === 0 || code === null) {
                    resolve();
                } else {
                    reject(new Error(`${this.name} server exited with code ${code}.`));
                }
            });
        });
    }

    pipeStdout(callback: (stdout: NodeJS.ReadableStream) => void) {
        this.pipeStdoutCallback = callback;
    }

    pipeStderr(callback: (stderr: NodeJS.ReadableStream) => void) {
        this.pipeStderrCallback = callback;
    }
}

/**
 * Holds server process specs for a watch/serve session and prepares runnable processes on demand —
 * the serve-side counterpart to `PackagesWatcher`. Returned by both `Watch` (the api server attached
 * to a watch session) and `Serve` (the served app servers).
 */
export class ServersWatcher {
    private specs: IServerProcessSpec[];

    constructor(specs: IServerProcessSpec[]) {
        this.specs = specs;
    }

    prepare(): RunnableServerProcess[] {
        return this.specs.map(spec => new RunnableServerProcess(spec));
    }

    get length() {
        return this.specs.length;
    }
}
