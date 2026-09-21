import { parentPort } from "node:worker_threads";

if (parentPort) {
    parentPort.postMessage("poll");
}
