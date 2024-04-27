const { parentPort, workerData } = require("worker_threads");

(async () => {
    const { handler: handlerParams } = workerData;
    try {
        const { handler } = require(handlerParams.path);
        const result = await handler(...handlerParams.args);

        parentPort.postMessage(JSON.stringify({ success: true, result, error: null }));
    } catch (error) {
        parentPort.postMessage(
            JSON.stringify({
                success: false,
                result: null,
                error: {
                    message: error.message,
                    stack: error.stack
                }
            })
        );
    }
})();
