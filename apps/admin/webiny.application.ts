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
    beforeBuild() {
        console.log("BEFORE BUILD");
    },
    afterBuild() {
        console.log("AFTER BUILD");
    },
    beforeDeploy() {
        console.log("BEFORE DEPLOY");
    },
    afterDeploy() {
        console.log("AFTER DEPLOY");
    }
});
