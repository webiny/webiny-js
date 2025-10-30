import { createFileManagerHooks } from "./fileManager/index.js";
import { createHeadlessCmsHooks } from "./headlessCms/index.js";
import { createSecurityHooks } from "./security/index.js";
import { createMailerHooks } from "./mailer/index.js";
import { createAcoHooks } from "./aco/index.js";
import type { AuditLogsContext } from "~/types.js";
import { createWebsiteBuilderHooks } from "~/subscriptions/websiteBuilder/index.js";

export const createSubscriptionHooks = (context: AuditLogsContext) => {
    createFileManagerHooks(context);
    createHeadlessCmsHooks(context);
    createSecurityHooks(context);
    createMailerHooks(context);
    createAcoHooks(context);
    createWebsiteBuilderHooks(context);
};
