import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";

interface Auth0Props {
    secretKey: string;
}

export const Auth0 = (props: Auth0Props) => {
    return (
        <>
            {/* Lambda vars */}
            <EnvVar varName={"WEBINY_API_IDP_SECRET_KEY"} value={props.secretKey} />
            {/* Admin app vars */}
            <EnvVar varName={"WEBINY_ADMIN_IDP_SECRET_KEY"} value={props.secretKey} />
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/CustomIdentityProvider.js"} />
            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
