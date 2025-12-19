import type { AuditLogsContext } from "~/types.js";
import { PageAfterCreateAuditHandler } from "./pages/PageAfterCreateHandler.js";
import { PageAfterUpdateAuditHandler } from "./pages/PageAfterUpdateHandler.js";
import { PageAfterPublishAuditHandler } from "./pages/PageAfterPublishHandler.js";
import { PageAfterUnpublishAuditHandler } from "./pages/PageAfterUnpublishHandler.js";
import { PageAfterDeleteAuditHandler } from "./pages/PageAfterDeleteHandler.js";
import { PageAfterDuplicateAuditHandler } from "./pages/PageAfterDuplicateHandler.js";
import { PageAfterMoveAuditHandler } from "./pages/PageAfterMoveHandler.js";
import { PageAfterCreateRevisionFromAuditHandler } from "./pages/PageAfterCreateRevisionFromHandler.js";
import { RedirectAfterCreateAuditHandler } from "./redirects/RedirectAfterCreateHandler.js";
import { RedirectAfterUpdateAuditHandler } from "./redirects/RedirectAfterUpdateHandler.js";
import { RedirectAfterDeleteAuditHandler } from "./redirects/RedirectAfterDeleteHandler.js";
import { RedirectAfterMoveAuditHandler } from "./redirects/RedirectAfterMoveHandler.js";

export const createWebsiteBuilderHooks = (context: AuditLogsContext) => {
    // Register page event handlers
    context.container.register(PageAfterCreateAuditHandler);
    context.container.register(PageAfterUpdateAuditHandler);
    context.container.register(PageAfterPublishAuditHandler);
    context.container.register(PageAfterUnpublishAuditHandler);
    context.container.register(PageAfterDeleteAuditHandler);
    context.container.register(PageAfterDuplicateAuditHandler);
    context.container.register(PageAfterMoveAuditHandler);
    context.container.register(PageAfterCreateRevisionFromAuditHandler);

    // Register redirect event handlers
    context.container.register(RedirectAfterCreateAuditHandler);
    context.container.register(RedirectAfterUpdateAuditHandler);
    context.container.register(RedirectAfterDeleteAuditHandler);
    context.container.register(RedirectAfterMoveAuditHandler);
};
