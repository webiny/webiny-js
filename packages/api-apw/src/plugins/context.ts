import { createAdvancedPublishingWorkflow } from "~/createApw";
import { PageDynamoDbAttributePlugin } from "./definitions/PageDynamoDbAttributePlugin";
import { createApwModels } from "./models";

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
    createAdvancedPublishingWorkflow(),
    createWorkflowFieldPlugin(),
    createApwModels()
];
