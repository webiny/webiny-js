import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";

const AutoInstall = defineExtension({
    type: "Project/AutoInstall",
    tags: { runtimeContext: "project" },
    description: "Auto-install Webiny with admin user credentials on first deploy.",
    paramsSchema: z.object({
        adminUser: z
            .object({
                firstName: z.string().describe("Admin user first name"),
                lastName: z.string().describe("Admin user last name"),
                email: z.string().email().describe("Admin user email"),
                password: z.string().min(8).describe("Admin user password (minimum 8 characters)")
            })
            .describe("Admin user credentials for installation")
    })
});

export default AutoInstall;
