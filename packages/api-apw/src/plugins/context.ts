import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import { createAdvancedPublishingWorkflow } from "~/createApw";
import { createApwModels } from "./models";
import apwHooks from "./hooks";

export default () => [
    new ContextPlugin<ApwContext>(context => {
        const getLocale = () => {
            return context.cms.getLocale();
        };

        const getIdentity = () => {
            return context.security.getIdentity();
        };

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        context.apw = createAdvancedPublishingWorkflow({
            getLocale,
            getIdentity,
            getTenant,
            storageOperations: {
                getModel: context.cms.getModel,
                getEntryById: context.cms.getEntryById,
                listLatestEntries: context.cms.listLatestEntries,
                createEntry: context.cms.createEntry,
                updateEntry: context.cms.updateEntry,
                deleteEntry: context.cms.deleteEntry
            }
        });
    }),
    createApwModels(),
    apwHooks()
];
