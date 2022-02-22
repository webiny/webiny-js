import { I18NContentContext } from "../types";
import lodashGet from "lodash.get";
import { SecurityPermission } from "@webiny/api-security/types";

interface ContentPermission {
    locales?: string[];
}

export default async (context: I18NContentContext): Promise<boolean> => {
    // If `content.i18n` permission is not present, immediately throw.
    const contentPermission = await context.security.getPermission<
        SecurityPermission<ContentPermission>
    >("content.i18n");
    if (!contentPermission) {
        return false;
    }

    // Otherwise, let's check if the identity has access to current content locale.
    // If `contentPermission.locales` array is present, that means identity's access is restricted
    // to the locales listed in it. If it's not present, that means there are no restrictions, or
    // in other words - identity can access all locales.
    const code = lodashGet(context, "i18nContent.locale.code");
    return !Array.isArray(contentPermission.locales) || contentPermission.locales.includes(code);
};
