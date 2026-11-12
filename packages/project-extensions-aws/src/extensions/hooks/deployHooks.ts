import { AdminAfterDeploy } from "./AdminAfterDeploy.js";
import { AdminBeforeDeploy } from "./AdminBeforeDeploy.js";
import { AfterDeploy } from "./AfterDeploy.js";
import { ApiAfterDeploy } from "./ApiAfterDeploy.js";
import { ApiBeforeDeploy } from "./ApiBeforeDeploy.js";
import { BeforeDeploy } from "./BeforeDeploy.js";
import { CoreAfterDeploy } from "./CoreAfterDeploy.js";
import { CoreBeforeDeploy } from "./CoreBeforeDeploy.js";

/*
 * Every deploy hook extension. `project-aws` registers their definitions and, when the SDK starts,
 * the implementations the project config names for them, both from this list.
 */
export const deployHooks = [
    BeforeDeploy,
    AfterDeploy,
    AdminBeforeDeploy,
    AdminAfterDeploy,
    ApiBeforeDeploy,
    ApiAfterDeploy,
    CoreBeforeDeploy,
    CoreAfterDeploy
];
