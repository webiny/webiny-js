import { createFileManagerHooks } from "./fileManager/index.js";
import { createHeadlessCmsHooks } from "./headlessCms/index.js";
import { createSecurityHooks } from "./security/index.js";
import { createMailerHooks } from "./mailer/index.js";
import { createAcoHooks } from "./aco/index.js";
import { createWebsiteBuilderHooks } from "~/subscriptions/websiteBuilder/index.js";
import { createAiHooks } from "./ai/index.js";
import type { Container } from "@webiny/di";

export const createSubscriptionHooks = (container: Container) => {
    createFileManagerHooks(container);
    createHeadlessCmsHooks(container);
    createSecurityHooks(container);
    createMailerHooks(container);
    createAcoHooks(container);
    createWebsiteBuilderHooks(container);
    createAiHooks(container);
};
