const got = require("got");
const getState = require("./getState");

const wait = (timeout = 10000) => {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
};

const ping = async () => {
    const appsStateFile = getState("apps");
    const { url } = appsStateFile.outputs.cdn;

    let totalTries = 0;
    while (true) {
        totalTries++;
        if (totalTries > 100) {
            console.log(
                `🚩 Even after a hundred "${url}" pings, a successful HTTP response wasn't received. Something must be wrong, exiting... `
            );
            process.exit(1);
        }

        try {
            console.log(`⏱ Pinging ${url}...`);
            await got(url);
            break;
        } catch (e) {
            // Weird, but only "ENOTFOUND" code means the CDN URL is not publicly available yet.
            if (e.code === "ENOTFOUND") {
                console.log("ℹ️ Site not ready yet, will wait a bit and ping again...");
                await wait();
                continue;
            }

            break;
        }
    }

    // Success, let's still wait a bit, just in case.
    await wait(30000);
    console.log("✅ Site deployed and ready!");
    process.exit(0);
};

ping();
