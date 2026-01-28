import React from "react";
import { Api, Admin, EnvVar } from "webiny/extensions";
import { ApiToken } from "webiny/api/security";

interface TenantManagementProps {
    /**
     * Must be in `wat_{string}` format to pass validation.
     */
    universalApiToken?: string;
}

export const TenantManagement = (props: TenantManagementProps) => {
    const token = props.universalApiToken;

    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.ts"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.tsx"} />

            {/* If a universal api token is passed, register an API key factory and an ENV var to hold the token.*/}
            {token ? (
                <>
                    <Api.Extension src={import.meta.dirname + "/api/features/UniversalApiKey.ts"} />
                    <EnvVar
                        varName={"WEBINY_API_UNIVERSAL_API_TOKEN"}
                        value={ApiToken.validate(token)}
                    />
                </>
            ) : null}
        </>
    );
};
