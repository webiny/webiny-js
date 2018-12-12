// @flow
import { addPlugin } from "webiny-plugins";
import { createHandler } from "webiny-api";
import config from "./configs";
import plugins from "./plugins";

addPlugin(...plugins);

export const api = createHandler(config);
