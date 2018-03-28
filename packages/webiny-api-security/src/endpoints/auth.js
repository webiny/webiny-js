// @flow
import { ApiResponse, ApiErrorResponse, Endpoint } from "webiny-api";
import type { ApiContainer } from "webiny-api";

class Auth extends Endpoint {
    init(api: ApiContainer) {
        const notAuthenticated = new ApiErrorResponse(
            {},
            "You are not authenticated!",
            "WBY_NOT_AUTHENTICATED",
            401
        );

        /**
         * Identity profile
         */
        api
            .get("Auth.Me", "/me", async ({ req }) => {
                if (!req.identity) {
                    return notAuthenticated;
                }
                return new ApiResponse(await req.identity.toJSON(req.query._fields));
            })
            .setPublic();

        api
            .patch("Auth.Me.Update", "/me", async ({ req: { identity, query, body } }) => {
                if (!identity) {
                    return notAuthenticated;
                }

                await identity.populate(body).save();

                return new ApiResponse(await identity.toJSON(query._fields));
            })
            .setPublic();
    }
}

Auth.classId = "Security.Authentication";
Auth.version = "1.0.0";

export default Auth;
