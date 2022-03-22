import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";

export const createCustomAuth = () => {
    return new ContextPlugin<SecurityContext>(({ security }) => {
        security.addAuthenticator(async token => {
            if (token === "ben") {
                return {
                    id: "ben",
                    type: "ben-the-master",
                    displayName: "Ben Read"
                };
            }

            return null;
        });

        security.addAuthorizer(async () => {
            const identity = security.getIdentity();

            if (identity && identity.type === "ben-the-master") {
                return [{ name: "*" }];
            }

            return null;
        });
    });
};
