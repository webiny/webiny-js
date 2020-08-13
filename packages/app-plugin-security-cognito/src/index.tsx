import React from "react";
import Auth from "@aws-amplify/auth";

import Authentication from "./Authentication";

export default config => {
    Auth.configure(config);

    return [
        {
            type: "app-template-renderer",
            render(children) {
                return <Authentication>{children}</Authentication>;
            }
        },
        {
            type: "app-admin-installer-security",
            render(children) {
                return <Authentication>{children}</Authentication>;
            }
        }
    ];
};
