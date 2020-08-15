import React from "react";
import Auth from "@aws-amplify/auth";
import { setContext } from "apollo-link-context";

import Authentication from "./Authentication";

export default config => {
    Auth.configure(config);

    return [
        {
            name: "apollo-link-cognito-context",
            type: "apollo-link",
            createLink() {
                return setContext(async (_, { headers }) => {
                    const user = await Auth.currentSession();
                    if (!user) {
                        return { headers };
                    }

                    const idToken = user.getIdToken().getJwtToken();
                    return {
                        headers: {
                            ...headers,
                            Authorization: `Bearer ${idToken}`
                        }
                    };
                });
            }
        },
        {
            type: "app-template-renderer",
            render(children) {
                return <Authentication>{children}</Authentication>;
            }
        },
        {
            type: "app-installer-security",
            render(children) {
                return <Authentication>{children}</Authentication>;
            }
        }
    ];
};
