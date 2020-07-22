const { workerData, parentPort } = require("worker_threads");
const execa = require("execa");

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
// parentPort.postMessage({ hello: workerData, done: false });

const date = new Date();
execa("lerna", ["run", "build", "--scope", workerData]).then(res => {
    console.log(`STDOUT ${workerData} in: ${new Date() - date}`);
    parentPort.postMessage({ hello: workerData, done: true });
});
