import { createImplementation } from "@webiny/di";
import { ErrorHandler } from "@webiny/cli-core/abstractions/index.js";
import { IBaseAppParams } from "@webiny/cli-core/abstractions/features/types.js";
import { GracefulError } from "@webiny/project";

const MATCH_STRING = "the stack is currently locked";
const LEARN_MORE_URL = "https://webiny.link/locked-stacks";

export class PendingOperationsGracefulErrorHandler implements ErrorHandler.Interface<IBaseAppParams> {
    execute({ error, params }: ErrorHandler.Params<IBaseAppParams>) {
        if (!error.message) {
            return;
        }

        if (!error.message.includes(MATCH_STRING)) {
            return;
        }

        const appName = params.app ? params.app : "{APP_NAME}";

        const message = [
            `The Pulumi error you've just experienced can occur`,
            `if one of the previous deployments has been interrupted or another deployment`,
            `is already in progress. For development purposes, the quickest way to get`,
            `past this issue is to run the following command: %s.`,
            `Learn more: ${LEARN_MORE_URL}`
        ].join(" ");

        const cmd = `yarn webiny pulumi ${appName} --env ${params.env} -- cancel`;
        throw GracefulError.from(error, message, cmd);
    }
}

export const pendingOperationsGracefulErrorHandler = createImplementation({
    abstraction: ErrorHandler,
    implementation: PendingOperationsGracefulErrorHandler,
    dependencies: []
});
