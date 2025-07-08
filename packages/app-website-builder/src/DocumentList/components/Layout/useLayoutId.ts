import { useI18N } from "@webiny/app-i18n";
import { useTenancy } from "@webiny/app-tenancy";

/**
 * Generates a `layoutId` to be used with the `<SplitView />` component.
 * The `layoutId` is essential for saving user preferences into localStorage.
 * The generation of the `layoutId` takes into account the current `tenantId`, `localeCode`, and the provided `applicationId`.
 *
 *  TODO: export the useLayoutId from a generic use package, such as app-admin. At the moment is not possible because of circular dependency issues.
 */
const useLayoutId = (applicationId: string) => {
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();
    const localeCode = getCurrentLocale("content");

    if (!tenant || !localeCode) {
        console.warn("Missing tenant or localeCode while creating layoutId");
        return null;
    }

    return `T#${tenant}#L#${localeCode}#A#${applicationId}`;
};

export { useLayoutId };
