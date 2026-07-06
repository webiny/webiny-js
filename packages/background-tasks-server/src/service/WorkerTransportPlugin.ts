import { Worker } from "node:worker_threads";
import { TaskServicePlugin } from "@webiny/background-tasks/api/plugins/TaskServicePlugin.js";
import type {
    ITaskService,
    ITaskServiceCreatePluginParams,
    ITaskServiceTask
} from "@webiny/background-tasks/api/plugins/TaskServicePlugin.js";
import type { ITask } from "@webiny/background-tasks/api/types.js";
import type { WorkerToParentMessage } from "~/worker/TaskOrchestratorMessage.js";

const DEFAULT_SERVER_PORT = 3000;
const DEFAULT_MAX_DURATION_MS = 86_400_000;

interface WorkerHandle {
    readonly worker: Worker;
    readonly startedAt: number;
    readonly taskId: string;
    status: "running" | "done" | "error" | "timeout";
    exitCode: number | null;
}

class WorkerTaskService implements ITaskService {
    private readonly getTenant: () => string;
    private readonly serverUrl: string;
    private readonly handles: Map<string, WorkerHandle> = new Map();

    public constructor(params: ITaskServiceCreatePluginParams) {
        this.getTenant = params.getTenant;
        const port = parseInt(process.env["WEBINY_SERVER_PORT"] || "") || DEFAULT_SERVER_PORT;
        this.serverUrl = `http://localhost:${port}/background-task`;
    }

    public async send(task: ITaskServiceTask, delay: number): Promise<unknown> {
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

        worker.on("exit", (code: number) => {
            handle.exitCode = code;
            if (handle.status === "running") {
                handle.status = code === 0 ? "done" : "error";
            }
        });

        worker.postMessage({
            type: "start",
            taskEvent: {
                webinyTaskId: task.id,
                webinyTaskDefinitionId: task.definitionId,
                tenant: this.getTenant(),
                delay
            },
            serverUrl: this.serverUrl,
            maxDurationMs: DEFAULT_MAX_DURATION_MS
        });

        return { workerId: worker.threadId, taskId: task.id };
    }

    public async fetch(task: ITask): Promise<Record<string, unknown> | null> {
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

export class WorkerTransportPlugin extends TaskServicePlugin {
    public static override readonly type: string = "tasks.taskService";
    public override name = "task.workerTransport";

    public createService(params: ITaskServiceCreatePluginParams): ITaskService {
        return new WorkerTaskService(params);
    }
}
