const WCP_APP_URL = process.env.WCP_APP_URL || "https://wcp.webiny.com";
const WCP_API_URL = process.env.WCP_API_URL || "https://api.wcp.webiny.com/graphql";

const { getUser } = require("./getUser");

module.exports = { getUser, WCP_APP_URL, WCP_API_URL };
