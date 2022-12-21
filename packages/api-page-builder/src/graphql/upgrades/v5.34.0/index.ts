import { UpgradePlugin } from "@webiny/api-upgrade";
import WebinyError from "@webiny/error";
import { PageBuilderContextObject, PbContext } from "~/graphql/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NContextObject } from "@webiny/api-i18n/types";
import { Folders } from "@webiny/api-folders/types";

interface CreatePageLinksParams {
    tenant: Tenant;
    pageBuilder: PageBuilderContextObject;
    folders: Folders;
    i18n: I18NContextObject;
}

interface FetchPagesAndCreateLinksParams {
    pageBuilder: PageBuilderContextObject;
    folders: Folders;
}

const fetchPagesAndCreateLinks = async (
    params: FetchPagesAndCreateLinksParams
): Promise<(string | undefined)[]> => {
    const { pageBuilder, folders } = params;

    /**
     *  Since `listPages` is paginated, we need a recursive function to fetch pages and create links.
     *
     * @param acc accumulator for results.
     * @param hasMoreItems continue the iteration or return the accumulator.
     * @param after the cursor value to pass to `listPages`.
     */
    async function fetchAndCreate(
        acc: (string | undefined)[],
        hasMoreItems: boolean,
        after?: string | null
    ): Promise<(string | undefined)[]> {
        /**
         * No more pages to fetch, return the accumulator.
         */
        if (!hasMoreItems) {
            return acc;
        }

        /**
         * Fetch page data and meta
         */
        const [data, meta] = await pageBuilder.listLatestPages({ limit: 100, after });
        const pageIds = data.map(page => page.pid);

        /**
         * Create `links` and return the `id`.
         */
        const linkIds = await Promise.all(
            pageIds.map(async id => {
                try {
                    const link = await folders.createLink({ id, folderId: "ROOT" });
                    return link.id;
                } catch (e) {
                    /**
                     * In case the link already exists for the current page, just return and continue the process.
                     */
                    if (e.code === "LINK_EXISTS") {
                        return;
                    }
                    throw e;
                }
            })
        );

        const result = [...acc, ...linkIds];
        return await fetchAndCreate(result, meta.hasMoreItems, meta.cursor);
    }

    return await fetchAndCreate([], true);
};

const createPageLinks = async (params: CreatePageLinksParams): Promise<void> => {
    const { tenant, pageBuilder, folders, i18n } = params;

    /**
     * Find all locales for the current tenant, so we can find all pages for each locale.
     */
    const [locales] = await i18n.locales.storageOperations.list({
        where: {
            tenant: tenant.id
        },
        limit: 100
    });

    if (locales.length === 0) {
        console.log(`There are no locales under the tenant "${tenant.id}".`);
        return;
    }

    for (const locale of locales) {
        i18n.setContentLocale(locale);

        /**
         * Fetch all pages for the current locale and create links
         */
        const linkIds = await fetchPagesAndCreateLinks({ pageBuilder, folders });

        if (linkIds.length === 0) {
            console.log(`There are no pages under the locale "${locale.code}".`);
            continue;
        }

        console.log(
            `${locale.code}: created ${linkIds.filter(Boolean).length} links from ${
                linkIds.length
            } pages.`
        );
    }
};

export const createUpgrade = (): UpgradePlugin<PbContext> => {
    return {
        type: "api-upgrade",
        version: "5.34.0",
        app: "page-builder",
        apply: async context => {
            const { security, tenancy, i18n, pageBuilder, folders } = context;

            /**
             * We need to be able to access all data.
             */
            security.disableAuthorization();

            const initialTenant = tenancy.getCurrentTenant();

            try {
                const tenants = await tenancy.listTenants();
                for (const tenant of tenants) {
                    tenancy.setCurrentTenant(tenant);
                    await createPageLinks({
                        tenant,
                        i18n,
                        pageBuilder,
                        folders
                    });
                }
            } catch (e) {
                console.log(
                    `Upgrade error: ${JSON.stringify({
                        message: e.message,
                        code: e.code,
                        data: e.data
                    })}`
                );
                throw new WebinyError(
                    `Could not finish the 5.34.0 upgrade. Please contact Webiny team on Slack and share the error.`,
                    "UPGRADE_ERROR",
                    {
                        message: e.message,
                        code: e.code,
                        data: e.data
                    }
                );
            } finally {
                /**
                 * Always enable the security after all the code runs.
                 */
                security.enableAuthorization();
                tenancy.setCurrentTenant(initialTenant);
            }
        }
    };
};
