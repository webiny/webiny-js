import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { PageDynamoDbAttributePlugin } from "~/plugins/definitions/PageDynamoDbAttributePlugin";

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
    new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            extend type PbPage {
                workflow: ID
            }
        `
    }),
    createWorkflowFieldPlugin()
    /*
     TODO: @ashutosh Make it configurable so that in case of `api-page-builder-so-ddb-es`,
      this plugin will be included automatically.
     This step is only required if you're using DynamoDB + ElasticSearch setup and you want
     to be able to get the value of the `special` field while listing pages.
     With this plugin, we ensure that the value of the `special` field is also stored in
     ElasticSearch, which is where the data is being retrieved from while listing pages.
    */
    // new IndexPageDataPlugin<PageWithWorkflow>(({ data, page }) => {
    //     // `data` represents the current page's data that will be stored in ElasticSearch.
    //     // Let's modify it, by adding the value of the new `special` flag to it.
    //     data.workflow = page.workflow;
    // }),
];
