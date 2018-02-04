// @flow
import bcrypt from "bcryptjs";
import type { Identity } from "../index";
import type { express$Request } from "webiny-api/flow-typed/npm/express_v4.x.x";
import AuthenticationError from "../services/authenticationError";

/**
 * Credentials strategy factory
 * @return {function(express$Request, Class<Identity>)}
 */
export default (config: { credentials: Function }) => {
    const error = new AuthenticationError(
        "Invalid credentials.",
        AuthenticationError.INVALID_CREDENTIALS
    );

    /**
     * Credentials authentication strategy.
     * @param req
     * @param identity
     */
    return (req: express$Request, identity: Class<Identity>): Promise<Identity> => {
        return new Promise(async (resolve, reject) => {
            const { username, password } = config.credentials(req);
            const instance = await identity.findOne({ query: { username } });

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
