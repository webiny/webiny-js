// @flow
import { ApiResponse, ApiErrorResponse } from "webiny-api";
import type { ApiContainer, Endpoint } from "webiny-api";
import type { IAuthentication } from "../../types";

export default (BaseEndpoint: Class<Endpoint>, config: Object, authentication: IAuthentication) => {
    class Auth extends BaseEndpoint {
        init(api: ApiContainer) {
            super.init(api);

            // Create api methods for each identity
            config.identities.map(({ identity: Identity, authenticate }) => {
                // Create api methods for each strategy
                authenticate.map(({ strategy, apiMethod }) => {
                    api.post(apiMethod.name, apiMethod.pattern, async ({ req }) => {
                        try {
                            const identity = await authentication.authenticate(
                                req,
                                Identity,
                                strategy
                            );
                            return new ApiResponse({
                                token: await authentication.createToken(identity),
                                identity: await identity.toJSON(req.query._fields)
                            });
                        } catch (e) {
                            return new ApiErrorResponse(
                                {},
                                e.message,
                                "WBY_INVALID_CREDENTIALS",
                                401
                            );
                        }
                    });
                });
            });
        }
    }

    return Auth;
};
