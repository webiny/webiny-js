import { FileManagerContext } from "~/types";

export default (context: FileManagerContext) => {
    const { tenancy, i18nContent } = context;
    if (!tenancy.getCurrentTenant()) {
        throw new Error("Tenant missing.");
    }

    if (!i18nContent.getLocale()) {
        throw new Error("Locale missing.");
    }

    return `T#${tenancy.getCurrentTenant().id}#L#${i18nContent.getLocale().code}#FM#`;
};
