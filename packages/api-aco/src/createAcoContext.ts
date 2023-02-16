import { ContextPlugin } from "@webiny/api";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import WebinyError from "@webiny/error";

import { createAcoCrud } from "~/createAcoCrud";
import { createAcoHooks } from "~/createAcoHooks";
import { createAcoStorageOperations } from "~/createAcoStorageOperations";
import { isInstallationPending } from "~/utils/isInstallationPending";

import { AcoContext } from "~/types";

const setupAcoContext = () =>
    new ContextPlugin<AcoContext>(async context => {
        const { tenancy, security, i18n } = context;

        if (isInstallationPending({ tenancy, i18n })) {
            return;
        }

        const getLocale = (): I18NLocale => {
            const locale = i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError(
                    "Missing content locale in api-aco/plugins/context.ts",
                    "LOCALE_ERROR"
                );
            }

            return locale;
        };

        const getTenant = (): Tenant => {
            return tenancy.getCurrentTenant();
        };

        const getIdentity = () => security.getIdentity();

        context.aco = createAcoCrud({
            getLocale,
            getIdentity,
            getTenant,
            storageOperations: createAcoStorageOperations({
                /**
                 * TODO: We need to figure out a way to pass "cms" from outside (e.g. apps/api/graphql)
                 */
                cms: context.cms,
                /**
                 * TODO: This is required for "entryFieldFromStorageTransform" which access plugins from context.
                 */
                getCmsContext: () => context,
                security
            })
        });
    });

export const createAcoContext = () => {
    return new ContextPlugin<AcoContext>(async context => {
        if (isInstallationPending(context)) {
            return;
        }

        await setupAcoContext().apply(context);
        await createAcoHooks().apply(context);
    });
};
