import { Tenant, I18NLocale } from "./types";

interface Params {
    tenant: Tenant;
    locale: I18NLocale;
}

export const createModelPartitionKey = (params: Params) => {
    const { tenant, locale } = params;
    return `T#${tenant.id}#L#${locale.code}#CMS#CM`;
};
