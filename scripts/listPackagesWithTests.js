#!/usr/bin/env node
const { getPackages } = require("./utils/getPackages");

(async () => {
    const packages = getPackages()
        .filter(item => item.hasTests)
        .map(item => item.packageFolderRelativePath);

    console.log(JSON.stringify(packages));
})();
