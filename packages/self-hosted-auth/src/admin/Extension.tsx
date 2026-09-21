import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { resolveGraphqlUrl } from "@webiny/app-admin/base/resolveApiUrl.js";
import { SelfHostedAuthGatewayFeature } from "./gateways/SelfHostedAuthGateway.js";
import { SelfHostedAuthFeature } from "./presentation/feature.js";
import { SelfHostedLogin } from "./SelfHostedLogin.js";

/*
 * The login screen renders before the user is authenticated, so the endpoint cannot come off
 * EnvConfig the way the rest of the app reads it. `SelfHostedAuthGateway` is configured with the
 * admin's own `resolveGraphqlUrl()` instead of a second copy of the rules, so a relative API URL
 * (what the dev proxy bakes in) resolves the same way here as everywhere else.
 *
 * The reset flag arrives as a baked-in env var, and for a related reason: there is no authenticated
 * call this screen could make to ask whether the mutations exist. Absent means on, matching the
 * build param the API reads.
 */
export const Extension = () => {
    const passwordResetEnabled = process.env.REACT_APP_SELF_HOSTED_EMAIL_PASSWORD_RESET !== "false";

    return (
        <>
            <RegisterFeature
                feature={SelfHostedAuthGatewayFeature}
                options={{ graphqlUrl: resolveGraphqlUrl() }}
            />
            <RegisterFeature feature={SelfHostedAuthFeature} />
            <SelfHostedLogin passwordResetEnabled={passwordResetEnabled} />
        </>
    );
};
