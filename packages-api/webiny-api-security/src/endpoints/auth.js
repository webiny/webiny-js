// @flow
import { ApiResponse, ApiErrorResponse, Endpoint } from "webiny-api";
import type { IApiContainer } from "webiny-api/flow-typed/webiny-api";

class Auth extends Endpoint {
    init(api: IApiContainer) {
        /**
         * Identity profile
         */
        api.get("Auth.Me", "/me", ({ req }) => {
            if (!req.identity) {
                return new ApiErrorResponse(
                    {},
                    "You are not authenticated!",
                    "WBY_NOT_AUTHENTICATED",
                    401
                );
            }
            return new ApiResponse(req.identity.toJSON(req.query._fields));
        });
    }
}

Auth.classId = "Security.Auth";
Auth.version = "1.0.0";

export default Auth;
