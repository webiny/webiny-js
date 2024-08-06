import { SecurityPermission } from "@webiny/api-security/types";
import { I18NContext } from "../types";

interface ContentPermission {
    locales?: string[];
}

export const hasI18NContentPermission = async (context: I18NContext): Promise<boolean> => {
    // If `content.i18n` permission is not present, immediately throw.
    const contentPermissions =
        await context.security.getPermissions<SecurityPermission<ContentPermission>>(
            "content.i18n"
        );

    if (!contentPermissions.length) {
        return false;
    }

    // Otherwise, let's check if the identity has access to current content locale.
    // If `contentPermission.locales` array is present, that means identity's access is restricted
    // to the locales listed in it. If it's not present, that means there are no restrictions, or
    // in other words - identity can access all locales.
    const locale = context.i18n.getContentLocale();

    if (!locale) {
        throw new Error("Missing content locale in 'hasI18NContentPermission'!");
    }

    return contentPermissions.some(current => {
        return !Array.isArray(current.locales) || current.locales.includes(locale.code);
    });
};
