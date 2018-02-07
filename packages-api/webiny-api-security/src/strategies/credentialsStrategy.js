// @flow
import bcrypt from "bcryptjs";
import type { Identity } from "../index";
import AuthenticationError from "../services/authenticationError";

/**
 * Credentials strategy factory
 * @return {function(express$Request, Class<Identity>)}
 */
export default (options: { usernameAttribute?: string, credentials?: Function } = {}) => {
    const error = new AuthenticationError(
        "Invalid credentials.",
        AuthenticationError.INVALID_CREDENTIALS
    );

    const config = { ...options };

    // Default credentials provider
    if (typeof config.credentials !== "function") {
        config.credentials = req => {
            return {
                username: req.body.username,
                password: req.body.password
            };
        };
    }

    if (!config.usernameAttribute) {
        config.usernameAttribute = "username";
    }

    /**
     * Credentials authentication strategy.
     * @param req
     * @param identity
     */
    return (req: express$Request, identity: Class<Identity>): Promise<Identity> => {
        return new Promise(async (resolve, reject) => {
            const { username, password } = config.credentials(req);
            const instance = await identity.findOne({
                query: { [config.usernameAttribute]: username }
            });

            if (!instance) {
                return reject(error);
            }

            bcrypt.compare(password, instance.password, (err, res) => {
                if (err || !res) {
                    return reject(error);
                }

                resolve(instance);
            });
        });
    };
};
