// @flow
import apiPlugins, { addPlugin } from "./plugins";

// Register required core plugins.
addPlugin(...apiPlugins);

export { createHandler } from "./lambda/lambda";
export { default as MySQLTable } from "./mysql";
