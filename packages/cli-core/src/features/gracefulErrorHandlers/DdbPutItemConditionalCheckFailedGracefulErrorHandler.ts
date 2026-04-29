import { createImplementation } from "@webiny/di";
import { ErrorHandler } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { GracefulError } from "@webiny/project";

const MATCH_STRING = "ConditionalCheckFailedException: The conditional request failed";
const LEARN_MORE_URL = "https://webiny.link/deployment-ddb-conditional-check-failed";

export class DdbPutItemConditionalCheckFailedGracefulErrorHandler implements ErrorHandler.Interface<IBaseAppParams> {
    execute({ error }: ErrorHandler.Params<IBaseAppParams>) {
        if (!error.message) {
            return;
        }

        if (!error.message.includes(MATCH_STRING)) {
            return;
        }

        const message = [
            `Looks like the deployment failed because Pulumi tried to insert a`,
            `record into a DynamoDB table, but the record already exists. The`,
            `easiest way to resolve this is to delete the record from the`,
            `table and try again.`,
            `Learn more: ${LEARN_MORE_URL}`
        ].join(" ");

        throw GracefulError.from(error, message);
    }
}

export const ddbPutItemConditionalCheckFailedGracefulErrorHandler = createImplementation({
    abstraction: ErrorHandler,
    implementation: DdbPutItemConditionalCheckFailedGracefulErrorHandler,
    dependencies: []
});
