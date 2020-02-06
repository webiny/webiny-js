const fetch = require("node-fetch");
const pRetry = require("p-retry");
const semver = require("semver");

async function getPackageVersion(name, tag = "latest") {
    const getVersion = async () => {
        const res = await fetch(`https://registry.npmjs.org/${name}`);
        const json = await res.json();

        const tagVersion = json["dist-tags"][tag];
        if (!tagVersion || semver.lte(tagVersion, json["dist-tags"]["latest"])) {
            return json["dist-tags"]["latest"];
        }

        return tagVersion;
    };

    return await pRetry(getVersion, { retries: 5 });
}

module.exports = { getPackageVersion };
