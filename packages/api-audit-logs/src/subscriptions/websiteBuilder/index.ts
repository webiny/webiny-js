import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";
import type { AuditLogsContext } from "~/types.js";
import { WebinyError } from "@webiny/error/index.js";

export const createWebsiteBuilderHooks = (context: AuditLogsContext) => {
    context.websiteBuilder.pages.onPageAfterCreate.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.CREATE);
            await createAuditLog("Website Page Created", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterCreate hook",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterUpdate.subscribe(async ({ page, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.UPDATE);
            await createAuditLog(
                "Website Page Updated",
                { before: original, after: page },
                page.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterUpdate hook",
                code: "AUDIT_LOGS_AFTER_PAGE_UPDATE_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterPublish.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.PUBLISH);
            await createAuditLog("Website Page Published", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterPublish hook",
                code: "AUDIT_LOGS_AFTER_PAGE_PUBLISH_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterUnpublish.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.UNPUBLISH);
            await createAuditLog("Website Page Unpublished", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterUnpublish hook",
                code: "AUDIT_LOGS_AFTER_PAGE_UNPUBLISH_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterDelete.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.DELETE);
            await createAuditLog("Website Page Delete", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterDelete hook",
                code: "AUDIT_LOGS_AFTER_PAGE_DELETE_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterDuplicate.subscribe(async ({ page, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.DUPLICATE);
            await createAuditLog(
                "Website Page Duplicate",
                { original, page },
                original.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterDuplicate hook",
                code: "AUDIT_LOGS_AFTER_PAGE_DUPLICATE_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterMove.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.MOVE);
            await createAuditLog("Website Page Move", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterMove hook",
                code: "AUDIT_LOGS_AFTER_PAGE_MOVE_HOOK"
            });
        }
    });

    context.websiteBuilder.pages.onPageAfterCreateRevisionFrom.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.CREATE_REVISION_FROM);
            await createAuditLog("Website Page Create Revision From", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterCreateRevisionFrom hook",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_REVISION_FROM_HOOK"
            });
        }
    });

    context.websiteBuilder.redirects.onRedirectAfterCreate.subscribe(async ({ redirect }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.CREATE);
            await createAuditLog("Website Redirect Created", redirect, redirect.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onRedirectAfterCreate hook",
                code: "AUDIT_LOGS_AFTER_REDIRECT_CREATE_HOOK"
            });
        }
    });

    context.websiteBuilder.redirects.onRedirectAfterUpdate.subscribe(
        async ({ redirect, original }) => {
            try {
                const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.UPDATE);
                await createAuditLog(
                    "Website Redirect Updated",
                    { before: original, after: redirect },
                    redirect.id,
                    context
                );
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onRedirectAfterUpdate hook",
                    code: "AUDIT_LOGS_AFTER_REDIRECT_UPDATE_HOOK"
                });
            }
        }
    );

    context.websiteBuilder.redirects.onRedirectAfterDelete.subscribe(async ({ redirect }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.DELETE);
            await createAuditLog("Website Redirect Deleted", redirect, redirect.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onRedirectAfterDelete hook",
                code: "AUDIT_LOGS_AFTER_REDIRECT_DELETE_HOOK"
            });
        }
    });

    context.websiteBuilder.redirects.onRedirectAfterMove.subscribe(async ({ redirect }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.MOVE);
            await createAuditLog("Website Redirect Moved", redirect, redirect.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onRedirectAfterMove hook",
                code: "AUDIT_LOGS_AFTER_REDIRECT_MOVE_HOOK"
            });
        }
    });
};
