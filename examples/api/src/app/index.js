import { api } from "webiny-api";
import config from "./../configs";

//import { app as cmsApp } from "webiny-api-cms";
import myApp from "./myApp";

api.configure(config());

api.use(myApp());
//api.use(cmsApp({}));

export default api;
