import { parentPort } from "node:worker_threads";
import type { ParentToWorkerMessage } from "./TaskOrchestratorMessage.js";
import { TaskOrchestrator } from "./TaskOrchestrator.js";

if (!parentPort) {
    throw new Error("workerEntry must be run inside a worker thread.");
}

const port = parentPort;

port.on("message", async (message: ParentToWorkerMessage) => {
    if (message.type !== "start") {
        return;
    }

    const orchestrator = new TaskOrchestrator(message, msg => port.postMessage(msg));
    await orchestrator.run();

    process.exit(0);
});
