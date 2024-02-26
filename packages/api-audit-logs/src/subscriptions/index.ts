import { createFormBuilderHooks } from "./formBuilder";
import { createPageBuilderHooks } from "./pageBuilder";
import { createFileManagerHooks } from "./fileManager";
import { createHeadlessCmsHooks } from "./headlessCms";
import { createSecurityHooks } from "./security";
import { createI18NHooks } from "./i18n";
import { createMailerHooks } from "./mailer";
import { createAcoHooks } from "./aco";
import { createApwHooks } from "./apw";
import { AuditLogsContext } from "~/types";

export const createSubscriptionHooks = (context: AuditLogsContext) => {
    createFormBuilderHooks(context);
    createPageBuilderHooks(context);
    createFileManagerHooks(context);
    createHeadlessCmsHooks(context);
    createSecurityHooks(context);
    createI18NHooks(context);
    createMailerHooks(context);
    createAcoHooks(context);
    context.wcp.canUseFeature("advancedPublishingWorkflow") && createApwHooks(context);
};
