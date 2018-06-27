import config from "./configs";
import { api } from "webiny-api";
import { app as cmsApp } from "webiny-api-cms";
import myApp from "./app";

api.configure(config())
    .use(myApp())
    .use(cmsApp());

api.use(myApp());
api.use(cmsApp({}));

export default api;
