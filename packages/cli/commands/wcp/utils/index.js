const WCP_APP_URL = process.env.WCP_APP_URL || "https://wcp.webiny.com";
const WCP_API_URL = process.env.WCP_API_URL || "https://api.wcp.webiny.com/graphql";

const { getUser } = require("./getUser");
const { getProjectEnvironmentBySlug } = require("./getProjectEnvironmentBySlug");
const { updateUserLastActiveOn } = require("./updateUserLastActiveOn");
const { setProjectId } = require("./setProjectId");
const { setWcpPat } = require("./setWcpPat");
const { getWcpPat } = require("./getWcpPat");
const { sleep } = require("./sleep");

module.exports = {
    getUser,
    getProjectEnvironmentBySlug,
    updateUserLastActiveOn,
    setProjectId,
    setWcpPat,
    getWcpPat,
    sleep,
    WCP_APP_URL,
    WCP_API_URL
};
