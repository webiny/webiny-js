import {
    onLocaleAfterCreateHook,
    onLocaleAfterUpdateHook,
    onLocaleAfterDeleteHook
} from "./locales";

import type { AuditLogsContext } from "~/types";

export const createI18NHooks = (context: AuditLogsContext) => {
    onLocaleAfterCreateHook(context);
    onLocaleAfterUpdateHook(context);
    onLocaleAfterDeleteHook(context);
};
