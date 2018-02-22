import execa from "execa";

export default () => {
    return async ({ logger, config }, next) => {
        if (config.preview) {
            return next();
        }

        logger.log("Verifying access to NPM...");
        try {
            await execa("npm", ["whoami"]);
            next();
        } catch (err) {
            throw new Error("EINVALIDNPMTOKEN: " + err.message);
        }
    };
};
