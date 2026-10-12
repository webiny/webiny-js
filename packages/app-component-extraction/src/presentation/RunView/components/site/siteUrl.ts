import { websiteUrl } from "../composed/websiteUrl.js";

/**
 * A page of the job's site, at the website, in the site's tenant.
 *
 * The website app takes the tenant from `?wb.tenant=` and falls back to root. Without it, a site
 * page's path opens root's page at the same path: the wrong site, with no error to show it.
 */
export const siteUrl = (domain: string | null, path: string, tenantId: string): string | null => {
    const url = websiteUrl(domain, path);
    return url ? `${url}?wb.tenant=${encodeURIComponent(tenantId)}` : null;
};
