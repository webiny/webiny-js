import { Worker } from "node:worker_threads";
import type { WorkerToParentMessage } from "~/worker/TaskOrchestratorMessage.js";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { InternalToken } from "~/domain/InternalToken.js";

// Matches findFreePort's search base in runApiServer (and the scheduler's self-callback default), so
// every self-callback in the server hosting type agrees on the same fallback. In practice never used:
// runApiServer always injects the resolved port as process.env.PORT.
const DEFAULT_SERVER_PORT = 3002;
const DEFAULT_MAX_DURATION_MS = 86_400_000;

interface WorkerHandle {
    readonly worker: Worker;
    readonly startedAt: number;
    readonly taskId: string;
    status: "running" | "done" | "error";
    exitCode: number | null;
}

class WorkerServiceImpl implements TaskService.Interface {
    private readonly serverUrl: string;
    private readonly handles: Map<string, WorkerHandle> = new Map();

    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly internalToken: InternalToken.Interface
    ) {
        // Single-process server hosting type: the worker POSTs the task back to THIS server's
        // `/background-task` route. The port is the one the server actually listens on — injected at
        // runtime as `process.env.PORT` by `runApiServer` (dynamic, chosen via findFreePort), NOT a
        // build-time value. It cannot be a build param: the port isn't known until the process starts.
        const port = process.env.PORT || DEFAULT_SERVER_PORT;
        this.serverUrl = `http://localhost:${port}/background-task`;
    }

    public async send(task: TaskService.SendTaskParams, delay: number): Promise<unknown> {
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            console.error("Tenant not found.");
            return null;
        }

        // Resolved relative to this module (import.meta.url), not the process cwd, so it works no
        // matter where the server is launched. The app bundler recognizes this exact shape and emits
        // the worker as its own chunk into build/ (the server build sets assetPrefix "auto" so the
        // chunk URL resolves relative to the running handler — see createRsbuildConfig). Un-bundled
        // (dev), import.meta.url is the real dist file and this resolves to dist/worker/workerEntry.js.
        const worker = new Worker(new URL("../worker/workerEntry.js", import.meta.url));

        const handle: WorkerHandle = {
            worker,
            startedAt: Date.now(),
            taskId: task.id,
            status: "running",
            exitCode: null
        };

        this.handles.set(task.id, handle);

        worker.on("message", (msg: WorkerToParentMessage) => {
            if (msg.type === "done") {
                handle.status = "done";
            } else if (msg.type === "error") {
                handle.status = "error";
                // Surface the worker's error — otherwise a failed task shows only as a stuck record.
                console.error(
                    `Background task "${task.id}" (${task.definitionId}) failed:`,
                    msg.error
                );
            }
        });

        worker.on("error", (err: Error) => {
            handle.status = "error";
            console.error(`Worker error for task "${task.id}": ${err.message}`);
        });

        worker.on("exit", (code: number) => {
            handle.exitCode = code;
            if (handle.status === "running") {
                handle.status = code === 0 ? "done" : "error";
            }
            /* Clean up handle after 60s to allow pending fetch() calls. */
            setTimeout(() => {
                this.handles.delete(task.id);
            }, 60_000);
        });

        worker.postMessage({
            type: "start",
            taskEvent: {
                webinyTaskId: task.id,
                webinyTaskDefinitionId: task.definitionId,
                tenant: tenant.id,
                delay,
                // Satisfy the shared runner's AWS-Step-Functions-shaped validation. No SFN in a single
                // process: executionName is a stable run id (the task id); endpoint/stateMachineId are
                // validate-only off-AWS.
                endpoint: this.serverUrl,
                executionName: task.id,
                stateMachineId: ""
            },
            serverUrl: this.serverUrl,
            maxDurationMs: DEFAULT_MAX_DURATION_MS,
            internalToken: this.internalToken.value
        });

        return { workerId: worker.threadId, taskId: task.id };
    }

    public async fetch(task: TaskService.Task): Promise<Record<string, unknown> | null> {
        const handle = this.handles.get(task.id);
        if (!handle) {
            return null;
        }

        return {
            status: handle.status,
            startedAt: handle.startedAt,
            exitCode: handle.exitCode
        };
    }
}

export const WorkerService = TaskService.createImplementation({
    implementation: WorkerServiceImpl,
    dependencies: [TenantContext, InternalToken]
});
