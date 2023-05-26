import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

/**
 * This hook is used to display a warning message to the user, that notifies
 * the user that the Lambda@Edge functions are not automatically deleted.
 * Deletion should be done manually.
 */

let websiteRouterOriginRequestFunction = "";

export const lambdaEdgeWarning = [
    // The reason we're retrieving `websiteRouterOriginRequestFunction` before destroy is because
    // when trying to do it afterwards, the stack is already deleted, and we can't retrieve the
    // stack output anymore.
    {
        type: "hook-before-destroy",
        name: "hook-before-destroy-lambda-edge-warning",
        hook(params: Record<string, any>) {
            const websiteOutput = getStackOutput({ folder: "apps/website", env: params.env });

            if (websiteOutput && websiteOutput.websiteRouterOriginRequestFunction) {
                websiteRouterOriginRequestFunction =
                    websiteOutput.websiteRouterOriginRequestFunction;
            }
        }
    },
    {
        type: "hook-after-destroy",
        name: "hook-after-destroy-lambda-edge-warning",
        hook(params: Record<string, any>, context: CliContext) {
            if (websiteRouterOriginRequestFunction) {
                context.warning(
                    "Lambda@Edge function %s was not automatically deleted. Make sure to delete it manually. Learn more: https://webiny.link/lambda-edge-warning",
                    websiteRouterOriginRequestFunction
                );
            }
        }
    }
];
