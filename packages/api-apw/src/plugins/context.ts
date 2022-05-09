import apwHooks from "./hooks";
import WebinyError from "@webiny/error";
import { createContentHeadlessCmsContext } from "@webiny/api-headless-cms";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import { createApw } from "~/createApw";
import { apwPageBuilderHooks } from "./pageBuilder";
import { createStorageOperations } from "~/storageOperations";
import { createManageCMSPlugin } from "~/plugins/createManageCMSPlugin";
import { SecurityPermission } from "@webiny/api-security/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { CreateApwContextParams } from "~/scheduler/types";
import { createScheduler } from "~/scheduler";
import { createCustomAuth } from "~/scheduler/handlers/executeAction/security";
import { isInstallationPending } from "./utils";
import { extendPbPageSettingsSchema } from "~/plugins/pageBuilder/extendPbPageSettingsSchema";
import { apwContentPagePlugins } from "~/plugins/pageBuilder/apwContentPagePlugins";

const setupApwContext = (params: CreateApwContextParams) =>
    new ContextPlugin<ApwContext>(async context => {
        const { tenancy, security, i18n, handlerClient } = context;

        if (isInstallationPending({ tenancy, i18n })) {
            return;
        }

        const contentHeadlessCmsContextPlugins = createContentHeadlessCmsContext({
            storageOperations: context.cms.storageOperations
        });
        /**
         * Register cms plugins required by `api-apw` package.
         */
        context.plugins.register([createManageCMSPlugin(), ...contentHeadlessCmsContextPlugins]);

        const getLocale = () => {
            const locale = i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError(
                    "Missing content locale in api-apw/plugins/context.ts",
                    "LOCALE_ERROR"
                );
            }

            return locale;
        };

        const getTenant = (): Tenant => {
            return tenancy.getCurrentTenant();
        };

        const getPermission = async (name: string): Promise<SecurityPermission | null> => {
            return security.getPermission(name);
        };
        const getIdentity = () => security.getIdentity();

        const scheduler = createScheduler({
            getLocale,
            getIdentity,
            getTenant,
            getPermission,
            storageOperations: params.storageOperations
        });

        context.apw = createApw({
            getLocale,
            getIdentity,
            getTenant,
            getPermission,
            storageOperations: createStorageOperations({
                /**
                 * TODO: We need to figure out a way to pass "cms" from outside (e.g. api/code/graphql)
                 */
                cms: context.cms,
                /**
                 * TODO: This is required for "entryFieldFromStorageTransform" which access plugins from context.
                 */
                getCmsContext: () => context
            }),
            scheduler,
            handlerClient
        });

        apwPageBuilderHooks({ pageBuilder: context.pageBuilder, apw: context.apw, getIdentity });
    });

export default (params: CreateApwContextParams) => [
    extendPbPageSettingsSchema(),
    setupApwContext(params),
    apwContentPagePlugins(),
    apwHooks(),
    createCustomAuth(params)
];
