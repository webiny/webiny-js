const { GracefulError } = require("./GracefulError");
const gracefulYarnErrorHandlers = require("./gracefulYarnErrorHandlers");

class GracefulYarnError extends GracefulError {
    static from(e, context) {
        if (e instanceof GracefulError) {
            return e;
        }

        for (const handler of gracefulYarnErrorHandlers) {
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

            return new GracefulYarnError(errorMessage, { cause: e });
        }
    }
}

module.exports = { GracefulYarnError };
