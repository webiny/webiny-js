import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import { createAdvancedPublishingWorkflow } from "~/createApw";
import { PageDynamoDbAttributePlugin } from "./definitions/PageDynamoDbAttributePlugin";
import { createApwModels } from "./models";
import apwHooks from "./hooks";

/* This is DynamoDB only entity attribute.
 * TODO: Think on how to implement this generally, agnostic to the storage operation types.
 */
const createWorkflowFieldPlugin = () => {
    return new PageDynamoDbAttributePlugin({
        attribute: "workflow",
        params: {
            type: "string"
        }
    });
};

export default () => [
    new ContextPlugin<ApwContext>(async context => {
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
    createWorkflowFieldPlugin(),
    createApwModels(),
    apwHooks()
];
