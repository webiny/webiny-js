// @flow
import { ApiResponse, ApiErrorResponse, Endpoint } from "webiny-api";
import type { ApiContainer } from "webiny-api";

class Auth extends Endpoint {
    init(api: ApiContainer) {
        /**
         * Identity profile
         */
        api
            .get("Auth.Me", "/me", async ({ req }) => {
                if (!req.identity) {
                    return new ApiErrorResponse(
                        {},
                        "You are not authenticated!",
                        "WBY_NOT_AUTHENTICATED",
                        401
                    );
                }
                return new ApiResponse(await req.identity.toJSON(req.query._fields));
            })
            .setPublic();
    }
}

Auth.classId = "Security.Authentication";
Auth.version = "1.0.0";

export default Auth;
