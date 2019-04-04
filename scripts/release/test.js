const getPackages = require("get-yarn-workspaces");
const path = require("path");

const independent = getPackages()
    .filter(dir => {
        const configPath = path.join(dir, ".releaserc.js");
        try {
            const config = require(configPath);
            return config.type === "independent";
        } catch(e) {
            return false;
        }
    })
    .map(dir => path.basename(dir));

console.log(independent);
