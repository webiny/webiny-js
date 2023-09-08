import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onLocaleAfterCreateHook = (context: AuditLogsContext) => {
    context.i18n.locales.onLocaleAfterCreate.subscribe(async ({ locale }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.I18N.LOCALE.CREATE);

            await createAuditLog("Locale created", locale, locale.code, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onLocaleAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_LOCALE_CREATE_HOOK"
            });
        }
    });
};

export const onLocaleAfterUpdateHook = (context: AuditLogsContext) => {
    context.i18n.locales.onLocaleAfterUpdate.subscribe(async ({ locale, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.I18N.LOCALE.UPDATE);

            await createAuditLog(
                "Locale updated",
                { before: original, after: locale },
                locale.code,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onLocaleAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_LOCALE_UPDATE_HOOK"
            });
        }
    });
};

export const onLocaleAfterDeleteHook = (context: AuditLogsContext) => {
    context.i18n.locales.onLocaleAfterDelete.subscribe(async ({ locale }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.I18N.LOCALE.DELETE);

            await createAuditLog("Locale deleted", locale, locale.code, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onLocaleAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_LOCALE_DELETE_HOOK"
            });
        }
    });
};
