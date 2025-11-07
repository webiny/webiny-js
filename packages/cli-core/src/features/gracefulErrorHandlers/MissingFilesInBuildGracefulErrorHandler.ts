import { createImplementation } from "@webiny/di";
import { ErrorHandler } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { GracefulError } from "@webiny/project";

const MATCH_STRING = "failed to compute archive hash for";

export class MissingFilesInBuildGracefulErrorHandler
    implements ErrorHandler.Interface<IBaseAppParams>
{
    execute({ error, params }: ErrorHandler.Params<IBaseAppParams>) {
        if (!error.message) {
            return;
        }

        if (!error.message.includes(MATCH_STRING)) {
            return;
        }

        const message = [
            "Looks like the deployment failed because Pulumi could not retrieve the built code.",
            "Please try again, or, alternatively, try building the app you're",
            "trying to deploy by running %s."
        ].join(" ");

        const cmd = `yarn webiny build ${params.app} --env ${params.env}`;
        throw GracefulError.from(error, message, cmd);
    }
}

export const missingFilesInBuildGracefulErrorHandler = createImplementation({
    abstraction: ErrorHandler,
    implementation: MissingFilesInBuildGracefulErrorHandler,
    dependencies: []
});
