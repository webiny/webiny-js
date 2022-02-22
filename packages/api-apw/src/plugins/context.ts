import apwHooks from "./hooks";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContentTypes, ApwContext, PageWithWorkflow } from "~/types";
import { createApw } from "~/createApw";
import { createStorageOperations } from "~/storageOperations";
import { createManageCMSPlugin } from "~/plugins/createManageCMSPlugin";
import { createContentHeadlessCmsContext } from "@webiny/api-headless-cms";

export default () => [
    new ContextPlugin<ApwContext>(async context => {
        const { tenancy, security, i18nContent } = context;

        const contentHeadlessCmsContextPlugins = createContentHeadlessCmsContext({
            storageOperations: context.cms.storageOperations
        });
        /**
         * Register cms plugins required by `api-apw` package.
         */
        context.plugins.register([createManageCMSPlugin(), ...contentHeadlessCmsContextPlugins]);

        const getLocale = () => {
            if (!i18nContent.locale) {
                throw new WebinyError(
                    "Missing context.i18nContent.locale in api-apw/plugins/context.ts",
                    "LOCALE_ERROR"
                );
            }
            // TODO: Check which locale do we need here?
            return i18nContent.locale;
        };

        const getTenant = () => {
            return tenancy.getCurrentTenant();
        };

        const getPermission = async (name: string) => {
            return security.getPermission(name);
        };
        const getIdentity = () => security.getIdentity();

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
            })
        });
        /**
         * TODO: @ashutosh
         * Move these call into a separate package let say "ap-apw-page-builder"
         */
        context.apw.addWorkflowGetter(ApwContentTypes.PAGE, async id => {
            const page = await context.pageBuilder.getPage<PageWithWorkflow>(id);
            return page.settings.apw.workflowId;
        });

        context.apw.addWorkflowGetter(ApwContentTypes.CMS_ENTRY, async (id, settings) => {
            if (!settings.modelId) {
                return null;
            }
            const model = await context.cms.getModel(settings.modelId);
            if (!model) {
                return null;
            }
            const entry = await context.cms.getEntry(model, { where: { id: id } });
            if (!entry) {
                return null;
            }
            return entry.values.workflow || null;
        });
    }),
    apwHooks()
];
