if (process.env.NODE_ENV === "development") {
    const { argv } = require("yargs");
    if (argv.require) {
        Array.isArray(argv.require) ? argv.require.map(r => require(r)) : require(argv.require);
    }
}

const serverless = require("serverless-http");
const app = require("./../index").default;

module.exports.handler = serverless(app());
