import { FileManagerContext } from "../../../types";

export default (context: FileManagerContext) => {
    const { security, i18nContent } = context;
    if (!security.getTenant()) {
        throw new Error("Tenant missing.");
    }

    if (!i18nContent.getLocale()) {
        throw new Error("Locale missing.");
    }

    return `T#${security.getTenant().id}#L#${i18nContent.getLocale().code}#FM#`;
};
