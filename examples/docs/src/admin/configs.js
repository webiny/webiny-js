import { app } from "webiny-app";

export default {
    security: {
        authentication: {
            cookie: "webiny-token",
            identities: [
                {
                    identity: "user",
                    authenticate: [
                        {
                            strategy: "credentials",
                            apiMethod: "/security/auth/login-user"
                        }
                    ]
                }
            ],
            onLogout() {
                app.router.goToRoute("Login");
            }
        }
    }
};
