import { createFileManagerHooks } from "./fileManager";
import { createHeadlessCmsHooks } from "./headlessCms";
import { createSecurityHooks } from "./security";
import { createI18NHooks } from "./i18n";
import { createMailerHooks } from "./mailer";
import { createAcoHooks } from "./aco";
import { createApwHooks } from "./apw";
import type { AuditLogsContext } from "~/types";

export const createSubscriptionHooks = (context: AuditLogsContext) => {
    createFileManagerHooks(context);
    createHeadlessCmsHooks(context);
    createSecurityHooks(context);
    createI18NHooks(context);
    createMailerHooks(context);
    createAcoHooks(context);
    context.wcp.canUseFeature("advancedPublishingWorkflow") && createApwHooks(context);
};
