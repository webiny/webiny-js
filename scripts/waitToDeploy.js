const got = require("got");
const getState = require("./getState");

const wait = () => {
    return new Promise(resolve => {
        setTimeout(resolve, 10000);
    });
};

const ping = async () => {
    const appsStateFile = getState("apps");
    const { url } = appsStateFile.outputs.cdn;

    while (true) {
        try {
            console.log(`⏱ Pinging ${url}...`);
            await got(url);

            // Success, let's still wait a bit, just in case.
            await wait();
            break;
        } catch (e) {
            if (e.code !== "ENOTFOUND") {
                // Success, let's still wait a bit, just in case.
                await wait();
                break;
            }

            console.log("ℹ️ Site not ready yet, will wait a bit and ping again...");
            await wait();
        }
    }

    console.log("ode");
    return true;
};

ping();
