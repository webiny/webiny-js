// @flow
import config from "./../configs";
import { api } from "webiny-api";
import { app as cmsApp } from "webiny-api-cms";
import myApp from "./../myApp";

module.exports = () => {
    api.configure(config())
        .use(myApp())
        .use(cmsApp())
        .install();
};