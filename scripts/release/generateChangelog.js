/**
 * This script is used to generate a changelog from the given tags.
 */
const { Changelog } = require("./Changelog");

const fromTag = "v5.39.0";
const toTag = "v5.39.1";

(async () => {
    const changelog = new Changelog(process.cwd());
    const md = await changelog.generate(fromTag, toTag);
    console.log(md);
})();
