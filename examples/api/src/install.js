// WIP
require("babel-register");
const config = require("./configs");
const { api } = require("webiny-api");
api.configure(config).install();
