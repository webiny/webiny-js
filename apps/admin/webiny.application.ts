/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */

import { createAdminApp } from "@webiny/pulumi-aws";

export default createAdminApp({
    config(app) {
        app.bucket.config.versioning({
            enabled: false
        });
    },
    onBeforeBuild() {
        console.log("BEFORE BUILD");
    },
    onAfterBuild() {
        console.log("AFTER BUILD");
    },
    onBeforeDeploy() {
        console.log("BEFORE DEPLOY");
    },
    onAfterDeploy() {
        console.log("AFTER DEPLOY");
    }
});
