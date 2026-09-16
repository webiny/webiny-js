import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { resolveGraphqlUrl } from "@webiny/app-admin/base/resolveApiUrl.js";
import { SelfHostedAuthFeature } from "./presentation/feature.js";
import { SelfHostedLogin } from "./SelfHostedLogin.js";

/*
 * The login screen renders before the user is authenticated, so it can't read the endpoint off
 * EnvConfig the way the rest of the app does: it sends its mutation itself rather than through the
 * container's GraphQL client. It uses the admin's own resolver rather than a second copy of the
 * rules, so a relative API URL (what the dev proxy bakes in) resolves the same way in both.
 *
 * The reset flag arrives the same way, as a baked-in env var, and for the same reason: there is no
 * authenticated call this screen could make to ask whether the mutations exist. Absent means on,
 * matching the build param the API reads.
 */
export const Extension = () => {
    const passwordResetEnabled = process.env.REACT_APP_SELF_HOSTED_EMAIL_PASSWORD_RESET !== "false";

    return (
        <>
            <RegisterFeature feature={SelfHostedAuthFeature} />
            <SelfHostedLogin
                graphqlUrl={resolveGraphqlUrl()}
                passwordResetEnabled={passwordResetEnabled}
            />
        </>
    );
};
