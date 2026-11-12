import { parentPort, workerData } from "worker_threads";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { handler: handlerParams } = workerData;

try {
    const handlerPath = handlerParams.path;
    const importSpecifier = path.isAbsolute(handlerPath)
        ? pathToFileURL(handlerPath).href
        : handlerPath;
    const { handler } = await import(importSpecifier);

    const result = await handler(...handlerParams.args);
    parentPort!.postMessage(JSON.stringify({ success: true, result, error: null }));
} catch (error) {
    const { message, code, data, stack } = error;

    parentPort!.postMessage(
        JSON.stringify({
            success: false,
            result: null,
            error: { message, code, data, stack }
        })
    );
} finally {
    process.exit(0);
}
