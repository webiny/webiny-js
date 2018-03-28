// @flow
import { ApiResponse, ApiErrorResponse } from "webiny-api";
import invariant from "invariant";
import type { ApiContainer, Endpoint } from "webiny-api";
import type { IAuthentication } from "../../types";
import AuthenticationError from "../services/authenticationError";

export default (BaseEndpoint: Class<Endpoint>, config: Object, authentication: IAuthentication) => {
    return class Auth extends BaseEndpoint {
        init(api: ApiContainer) {
            super.init(api);

            // Create API methods for each identity
            config.identities.map(({ identity: Identity, authenticate }) => {
                // Create api methods for each strategy
                authenticate.map(({ strategy, apiMethod, expiresOn }) => {
                    api
                        .post(apiMethod.name, apiMethod.pattern, async ({ req }) => {
                            try {
                                const identity = await authentication.authenticate(
                                    req,
                                    Identity,
                                    strategy
                                );

                                const error = `"expiresOn" function must be configured for "${strategy}" strategy!`;
                                invariant(typeof expiresOn === "function", error);

                                let expiration = expiresOn(req);
                                if (expiration instanceof Date) {
                                    expiration = Math.floor(expiration.getTime() / 1000);
                                }

                                return new ApiResponse({
                                    token: await authentication.createToken(identity, expiration),
                                    identity: await identity.toJSON(req.query._fields),
                                    expiresOn: expiration
                                });
                            } catch (e) {
                                const response = new ApiErrorResponse({}, e.message);
                                if (e instanceof AuthenticationError) {
                                    response.errorCode = "WBY_INVALID_CREDENTIALS";
                                    response.statusCode = 401;
                                } else {
                                    response.errorCode = "WBY_INTERNAL_ERROR";
                                    response.statusCode = 500;
                                }
                                return response;
                            }
                        })
                        .setPublic();
                });
            });
        }
    };
};
