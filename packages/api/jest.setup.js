const path = require("path");
const base = require("../../jest.config.base");

module.exports = {
    ...base({ path: __dirname })
};
