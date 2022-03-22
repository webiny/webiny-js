const base = require("../../jest.config.base");

// TODO establish why these are not being pulled from .env
process.env.WCP_APP_URL = "https://app.webiny.com/";
process.env.WCP_API_URL = "https://d16ix00y8ek390.cloudfront.net";

module.exports = {
    ...base({ path: __dirname })
};
