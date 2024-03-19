const { blue } = require("chalk");
const MATCH_STRING = "SubscriptionRequiredException";

module.exports = {
    type: "cli-command-error",
    handle: ({ context, error }) => {
        const { message } = error;
        const hasError = typeof message === "string" && message.includes(MATCH_STRING);
        if (!hasError) {
            return;
        }

        context.info(
            [
                `In most cases, the ${blue(
                    "SubscriptionRequiredException: The AWS Access Key Id needs a subscription for the service"
                )} error means that your AWS account hasn't been completely activated. For more information, please visit https://docs.webiny.com/docs/how-to-guides/deployment/deploy-your-project#subscriptionrequiredexception-the-aws-access-key-id-needs-a-subscription-for-the-service`
            ].join(" ")
        );
    }
};
