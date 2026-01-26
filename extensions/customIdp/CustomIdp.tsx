import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { Api, Admin } from "@webiny/project-aws";

export interface IdpProps {
    secretKey: string;
}

export const CustomIdp = (props: IdpProps) => {
    return (
        <>
            {/* Lambda vars */}
            <EnvVar varName={"WEBINY_API_IDP_SECRET_KEY"} value={props.secretKey} />
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/CustomIdentityProvider.ts"} />
            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.tsx"} />
        </>
    );
};
