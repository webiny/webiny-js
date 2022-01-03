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
];
