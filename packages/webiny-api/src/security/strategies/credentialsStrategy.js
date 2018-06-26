// @flow
import bcrypt from "bcryptjs";
import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql";
import type { Identity } from "../../entities";
import type { IStrategy } from "../../../types";
import AuthenticationError from "../../services/AuthenticationError";

/**
 * Credentials strategy factory
 * @return {function(express$Request, Class<Identity>)}
 */
export default (options: { usernameAttribute?: string } = {}): IStrategy => {
    const error = new AuthenticationError(
        "Invalid credentials.",
        AuthenticationError.INVALID_CREDENTIALS
    );

    const config = { ...options };

    if (!config.usernameAttribute) {
        config.usernameAttribute = "email";
    }

    return {
        args() {
            return {
                username: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
                remember: { type: GraphQLBoolean }
            };
        },
        /**
         * Credentials authentication strategy.
         * Tries loading the identity instance using the provided Identity class.
         * @param args
         * @param identity
         */
        authenticate(
            args: { username: string, password: string },
            identity: Class<Identity>
        ): Promise<Identity> {
            return new Promise(async (resolve, reject) => {
                const instance: Identity = (await identity.findOne({
                    query: { [config.usernameAttribute]: args.username }
                }): any);

                if (!instance) {
                    return reject(error);
                }

                // $FlowFixMe - instance that will be validated will have "password" attribute.
                bcrypt.compare(args.password, instance.password, (err, res) => {
                    if (err || !res) {
                        return reject(error);
                    }

                    resolve(instance);
                });
            });
        }
    };
};
