// @flow
import { createHandler, dataSource as coreApi } from "webiny-api";
import { dataSource as cmsApi } from "webiny-api-cms";
import config from "./configs";
import "./plugins";

export const api = createHandler({
    dataSources: [coreApi(), cmsApi()],
    ...config
});
