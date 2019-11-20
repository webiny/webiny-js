const fetch = require("node-fetch");
const pRetry = require("p-retry");

async function getPackageVersion(name, tag = "latest") {
    const getVersion = async () => {
        const res = await fetch(`https://registry.npmjs.org/${name}`);
        const json = await res.json();

        return json["dist-tags"][tag] || json["dist-tags"]["latest"];
    };

    return await pRetry(getVersion, { retries: 5 });
}

module.exports = { getPackageVersion };
