import WebinyError from "@webiny/error";
import { CmsContext } from "@webiny/api-headless-cms/types";

export const createBasePartitionKey = ({ tenancy, cms }: CmsContext): string => {
    const tenant = tenancy.getCurrentTenant();
    if (!tenant) {
        throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
    }

    const locale = cms.getLocale();
    if (!locale) {
        throw new WebinyError("Locale missing.", "LOCALE_NOT_FOUND");
    }

    return `T#${tenant.id}#L#${locale.code}#CMS`;
};

export const paginateBatch = async <T = Record<string, any>>(
    items: T[],
    perPage: number,
    execute: (items: T[]) => Promise<any>
) => {
    const pages = Math.ceil(items.length / perPage);
    for (let i = 0; i < pages; i++) {
        await execute(items.slice(i * perPage, i * perPage + perPage));
    }
};
