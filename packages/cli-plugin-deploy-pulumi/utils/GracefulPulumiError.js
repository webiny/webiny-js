const { GracefulError } = require("./GracefulError");
const gracefulPulumiErrorHandlers = require("./gracefulPulumiErrorHandlers");

class GracefulPulumiError extends GracefulError {
    static from(e) {
        if (e instanceof GracefulError) {
            return e;
        }

        for (const handler of gracefulPulumiErrorHandlers) {
            const message = handler({ error: e });
            if (message) {
                return new GracefulPulumiError(message);
            }
        }
    }
}

module.exports = { GracefulPulumiError };
