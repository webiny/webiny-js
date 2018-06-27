require("babel-register");
const config = require("./configs");
const { api } = require("webiny-api");
const { default: myApp } = require("./myApp");
const { app: cmsApp } = require("webiny-api-cms");

api.configure(config())
    .use(myApp())
    .use(cmsApp())
    .install();
