// @flow
import { createHandler, dataSource as coreApi } from "webiny-api";
export { default as files } from "./files";
import config from "./configs";
//import { dataSource as cmsApi } from "webiny-api-cms";

export const api = createHandler({
    dataSources: [coreApi],
    ...config
});
