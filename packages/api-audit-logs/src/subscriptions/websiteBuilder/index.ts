import type { Container } from "@webiny/di";
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

export const createWebsiteBuilderHooks = (container: Container) => {
    // Register page event handlers
    container.register(PageAfterCreateAuditHandler);
    container.register(PageAfterUpdateAuditHandler);
    container.register(PageAfterPublishAuditHandler);
    container.register(PageAfterUnpublishAuditHandler);
    container.register(PageAfterDeleteAuditHandler);
    container.register(PageAfterDuplicateAuditHandler);
    container.register(PageAfterMoveAuditHandler);
    container.register(PageAfterCreateRevisionFromAuditHandler);

    // Register redirect event handlers
    container.register(RedirectAfterCreateAuditHandler);
    container.register(RedirectAfterUpdateAuditHandler);
    container.register(RedirectAfterDeleteAuditHandler);
    container.register(RedirectAfterMoveAuditHandler);
};
