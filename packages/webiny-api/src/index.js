// @flow
import { addPlugin } from "webiny-plugins";
import apiPlugins from "./plugins";

// Register required core plugins.
addPlugin(...apiPlugins);

export { createHandler } from "./lambda/lambda";
export { default as MySQLTable } from "./mysql";
