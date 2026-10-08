import http from "node:http";
import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import type { StartMessage, WorkerToParentMessage } from "./TaskOrchestratorMessage.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";

interface TaskResponse {
    status: string;
    input?: Record<string, unknown>;
    wait?: number;
    [key: string]: unknown;
}

/* Dumb HTTP client loop. It posts the task event to the running server's background-task
 * endpoint, then continues, exits, or errors based on the response status. ProcessTimer is the
 * safety net for the worker's maximum allowed duration. */
export class TaskOrchestrator {
    private readonly serverUrl: string;
    private readonly taskEvent: StartMessage["taskEvent"];
    private readonly timer: Timer.Interface;
    private readonly internalToken: string;
    private readonly postMessage: (msg: WorkerToParentMessage) => void;

    public constructor(message: StartMessage, postMessage: (msg: WorkerToParentMessage) => void) {
        this.serverUrl = message.serverUrl;
        this.taskEvent = message.taskEvent;
        this.timer = new ProcessTimer(message.maxDurationMs);
        this.internalToken = message.internalToken;
        this.postMessage = postMessage;
    }

    public async run(): Promise<void> {
        const taskId = this.taskEvent.webinyTaskId;

        try {
            if (this.taskEvent.delay > 0) {
                await this.wait(this.taskEvent.delay * 1000);
            }

            let input: Record<string, unknown> = {};
            let continueLoop = true;

            while (continueLoop) {
                if (this.timer.getRemainingMilliseconds() <= 0) {
                    this.postMessage({
                        type: "error",
                        taskId,
                        error: "Task exceeded maximum duration."
                    });
                    return;
                }

                const payload = {
                    ...this.taskEvent,
                    input
                };

                const response = await this.post(payload);

                switch (response.status) {
                    case "continue": {
                        input = response.input || {};
                        if (response.wait && response.wait > 0) {
                            await this.wait(response.wait * 1000);
                        }
                        break;
                    }
                    case "done": {
                        this.postMessage({ type: "done", taskId, result: response });
                        continueLoop = false;
                        break;
                    }
                    case "error": {
                        this.postMessage({
                            type: "error",
                            taskId,
                            error: JSON.stringify(response)
                        });
                        continueLoop = false;
                        break;
                    }
                    default: {
                        this.postMessage({
                            type: "error",
                            taskId,
                            error: `Unknown response status: ${response.status}`
                        });
                        continueLoop = false;
                        break;
                    }
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.postMessage({ type: "error", taskId, error: message });
        }
    }

    private post(payload: Record<string, unknown>): Promise<TaskResponse> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.serverUrl);
            const body = JSON.stringify(payload);

            /*
             * The server answers only once the iteration finishes, so this is how long one iteration
             * may take. It used to be a fixed 60s, well short of the task's own budget: an AI call
             * that retried through a provider overload failed the task for running a little over a
             * minute. Bounded by what is left of the budget instead.
             *
             * A deadline, not the request's `timeout` option. That one only measures silence and
             * restarts on every chunk, so a response trickling in could outlive the budget and still
             * come back as `done`.
             */
            const remaining = this.timer.getRemainingMilliseconds();
            let deadline: NodeJS.Timeout | undefined;

            const fail = (error: Error) => {
                clearTimeout(deadline);
                reject(error);
            };

            const req = http.request(
                {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "content-length": Buffer.byteLength(body),
                        "x-webiny-background-task-token": this.internalToken
                    }
                },
                res => {
                    let data = "";
                    res.on("data", chunk => {
                        data += chunk;
                    });
                    // Where a deadline that fires mid-response surfaces.
                    res.on("error", fail);
                    res.on("end", () => {
                        clearTimeout(deadline);
                        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                            return;
                        }
                        try {
                            resolve(JSON.parse(data) as TaskResponse);
                        } catch {
                            reject(new Error(`Invalid JSON response: ${data}`));
                        }
                    });
                }
            );

            deadline = setTimeout(() => {
                const exceeded = new Error("Task exceeded maximum duration.");
                req.destroy(exceeded);
                fail(exceeded);
            }, remaining);

            req.on("error", fail);
            req.write(body);
            req.end();
        });
    }

    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
