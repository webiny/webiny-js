const { Worker } = require("worker_threads");
const readJson = require("load-json-file");
const getWorkspaces = require("get-yarn-workspaces");
const { yellow } = require("chalk");

const getPackages = () => {
    return getWorkspaces()
        .map(path => {
            const packageJsonPath = path + "/package.json";
            if (!packageJsonPath.includes("packages/")) {
                return null;
            }
            const output = { name: null, packageJsonPath, dependsOn: [] };

            try {
                output.packageJson = readJson.sync(packageJsonPath);
            } catch {
                console.log(yellow(`Ignoring ${path}/package.json`));
                return null;
            }

            output.name = output.packageJson.name;

            ["dependencies", "devDependencies", "peerDependencies"].map(depType => {
                if (output.packageJson[depType]) {
                    const deps = Object.keys(output.packageJson[depType]);
                    for (let i = 0; i < deps.length; i++) {
                        let dep = deps[i];
                        if (dep.startsWith("@webiny")) {
                            output.dependsOn.push(dep);
                        }
                    }
                }
            });
            return output;
        })
        .filter(Boolean);
};

function runService(workerData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__dirname + "/service.js", { workerData });
        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", code => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

async function run(...args) {
    const result = await runService(...args);
    // console.log(result);
}

const allPackages = getPackages();
const builtPackages = [];

async function buildPackagesBatch() {
    console.log("New batch...");
    // Which packages we want to have in this batch, built in parallel?
    const allPackagesBatch = [];
    for (let i = 0; i < allPackages.length; i++) {
        let pckg = allPackages[i];

        // If package already built, then just move on to the next one.
        if (builtPackages.includes(pckg.name)) {
            continue;
        }

        let allDependenciesReady = true;
        for (let j = 0; j < pckg.dependsOn.length; j++) {
            let item = pckg.dependsOn[j];
            if (!builtPackages.includes(item)) {
                allDependenciesReady = false;
                break;
            }
        }

        if (allDependenciesReady) {
            allPackagesBatch.push(pckg.name);
        }
    }

    const startCompleteBatch = new Date();
    const promises = [];

    console.log(`Building ${allPackagesBatch.length} package(s)...`);
    console.log(allPackagesBatch);

    for (let i = 0; i < allPackagesBatch.length; i++) {
        let pckg = allPackagesBatch[i];
        promises.push(run(pckg));
    }

    builtPackages.push(...allPackagesBatch);
    await Promise.all(promises);

    console.log("batch done", new Date() - startCompleteBatch);
}

(async () => {
    const date = new Date();
    while (builtPackages.length < allPackages.length) {
        console.log("IDEMO RUNATI WEEE -------------------------------------------");
        await buildPackagesBatch();

        const built = builtPackages.length;
        const all = allPackages.length;
        const percentage = (built / all) * 100;
        console.log("RUN OVER, STATUS :::", `${built} / ${all}`, `(${percentage.toFixed(2)}%)`);
    }

    const doneIn = new Date() - date;
    setTimeout(() => {
        const seconds = doneIn / 1000;
        const minutes = (seconds / 60).toFixed(2);
        console.log("============================================");
        console.log("Final, minutes: ", minutes);
        console.log("============================================");
    }, 500);
})();
