/**
 * For more information on the Website project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/website/introduction
 */

import { createWebsiteApp } from "@webiny/pulumi-aws";

export default createWebsiteApp({
    id: "website",
    name: "Website",
    description: "Your project's public website.",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
});
