import { CliContext } from "@webiny/cli/types";

/**
 * This hook is used to display a warning message to the user, that notifies
 * the user that the Lambda@Edge functions are not automatically deleted.
 * Deletion should be done manually.
 */
export const lambdaEdgeWarning = {
    type: "hook-after-destroy",
    name: "hook-after-destroy-lambda-edge-warning",
    hook(params: Record<string, any>, context: CliContext) {
        if (process.env.WCP_PROJECT_ENVIRONMENT || process.env.WEBINY_MULTI_TENANCY === "true") {
            context.warning(
                "Lambda@Edge function %s was not automatically deleted. Make sure to delete it manually. Learn more: https://webiny.link/lambda-edge-warning",
                "website-router-origin-request"
            );
        }
    }
};
