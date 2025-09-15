import { parentPort, workerData } from "worker_threads";

const { handler: handlerParams } = workerData;

try {
    //eslint-disable-next-line import/dynamic-import-chunkname
    const { default: importedCode } = await import(handlerParams.path);
    const { handler } = importedCode;

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
