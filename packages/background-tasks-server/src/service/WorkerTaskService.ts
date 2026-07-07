import { Worker } from "node:worker_threads";
import type { WorkerToParentMessage } from "~/worker/TaskOrchestratorMessage.js";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { BuildParams } from "@webiny/api-core/exports/api.js";
import { InternalToken } from "~/domain/InternalToken.js";

const DEFAULT_SERVER_PORT = 3000;
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
        private readonly buildParams: BuildParams.Interface,
        private readonly internalToken: InternalToken.Interface
    ) {
        const port = this.buildParams.get<number>("SERVER_PORT") || DEFAULT_SERVER_PORT;
        this.serverUrl = `http://localhost:${port}/background-task`;
    }

    public async send(task: TaskService.SendTaskParams, delay: number): Promise<unknown> {
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            console.error("Tenant not found.");
            return null;
        }

        const workerPath = new URL("../worker/workerEntry.js", import.meta.url);
        const worker = new Worker(workerPath);

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
                delay
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
    dependencies: [TenantContext, BuildParams, InternalToken]
});
