import config from "./configs";
import { api } from "webiny-api";
import { app as cmsApp } from "webiny-api-cms";
import myApp from "./myApp";

api.configure(config())
    .use(cmsApp())
    .use(myApp());

export default api;
