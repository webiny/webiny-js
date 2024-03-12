const { GracefulError } = require("./GracefulError");
const gracefulPulumiErrorHandlers = require("./gracefulPulumiErrorHandlers");

class GracefulPulumiError extends GracefulError {
    static from(e, context) {
        if (e instanceof GracefulError) {
            return e;
        }

        for (const handler of gracefulPulumiErrorHandlers) {
            const result = handler({ error: e, context });
            if (!result) {
                continue;
            }

            let errorMessage = result;
            if (typeof result === "object") {
                const { message, learnMore } = result;

                errorMessage = message;
                if (learnMore) {
                    errorMessage += ` Learn more: ${learnMore}.`;
                }
            }

            return new GracefulPulumiError(errorMessage, { cause: e });
        }
    }
}

module.exports = { GracefulPulumiError };
