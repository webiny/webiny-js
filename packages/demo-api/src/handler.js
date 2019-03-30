// @flow
import "source-map-support/register";
import dotenv from "dotenv";
import { registerPlugins } from "webiny-plugins";
import { createHandler } from "webiny-api";
import config from "./configs";
import plugins from "./plugins";

dotenv.config({ path: __dirname + "/../.env" });

registerPlugins(plugins);
export const handler = createHandler(config);
