const { parentPort, workerData } = require("worker_threads");

(async () => {
    const { handler: handlerParams } = workerData;
    try {
        const { handler } = require(handlerParams.path);
        const result = await handler(...handlerParams.args);

        parentPort.postMessage(JSON.stringify({ success: true, result, error: null }));
    } catch (error) {
        const { message, code, data, stack } = error;

        parentPort.postMessage(
            JSON.stringify({
                success: false,
                result: null,
                error: { message, code, data, stack }
            })
        );
    } finally {
        process.exit(0);
    }
})();
