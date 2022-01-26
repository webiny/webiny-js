/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */

import { createAdminApplication } from "@webiny/pulumi-aws";
import { afterDeploy } from "./cli/afterDeploy";

export default createAdminApplication({
    id: "admin",
    name: "Admin Area",
    description: "Your project's admin area.",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    },
    config(app) {
        app.bucket.config.versioning = {
            enabled: true
        };
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
    afterDeploy: afterDeploy
});
