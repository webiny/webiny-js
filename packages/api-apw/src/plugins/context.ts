import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContentTypes, ApwContext, PageWithWorkflow } from "~/types";
import { createApw } from "~/createApw";
import { createApwModels } from "./models";
import apwHooks from "./hooks";
import { createStorageOperations } from "~/storageOperations";

export default () => [
    new ContextPlugin<ApwContext>(async context => {
        const { tenancy, security, i18nContent } = context;

        const getLocale = () => {
            // TODO: Check which locale do we need here?
            return i18nContent.locale;
        };

        const getTenant = () => {
            return tenancy.getCurrentTenant();
        };

        const getPermission = (name: string) => security.getPermission(name);
        const getIdentity = () => security.getIdentity();

        context.apw = createApw({
            getLocale,
            getIdentity,
            getTenant,
            getPermission,
            storageOperations: createStorageOperations({
                cms: context.cms,
                getCmsContext: () => context
            })
        });

        context.apw.addWorkflowGetter(ApwContentTypes.PAGE, async id => {
            const page = await context.pageBuilder.getPage<PageWithWorkflow>(id);
            return page.settings.apw.workflowId;
        });

        context.apw.addWorkflowGetter(ApwContentTypes.CMS_ENTRY, async (id, settings) => {
            const model = await context.cms.getModel(settings.modelId);
            const entry = await context.cms.getEntry(model, { where: { id: id } });
            return entry.values.workflow;
        });
    }),
    createApwModels(),
    apwHooks()
];
