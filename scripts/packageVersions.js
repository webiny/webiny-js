const path = require("path");
const readJson = require("load-json-file");
const getPackages = require("get-yarn-workspaces");
const { green, blue, red } = require("chalk");

(async () => {
    const packages = getPackages().filter(p => !p.includes("examples/"));

    for (let i = 0; i < packages.length; i++) {
        const package = packages[i];
        try {
            const json = await readJson(path.join(package, "package.json"));
            console.log(`${json.name}@${json.version}`);
            Object.keys(json.dependencies).forEach(key => {
                if (!key.startsWith("@webiny")) {
                    return;
                }
                console.log(`- ${key}@${green(json.dependencies[key])}`);
            });
            console.log();
        } catch (er) {
            console.log(`${blue(">")} ${er.message} in ${red(path.basename(package))}!`);
        }
    }

    process.exit(0);
})();
