/**
 * NOTE: this file will be auto-detected by jest.config.base.js in the root of the repo!
 */
const path = require("path");
const { setupDynalite } = require("@webiny/project-utils/testing/dynalite");

setupDynalite(path.resolve(__dirname, "../../"));
