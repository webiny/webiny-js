import React from "react";
import { SelfHostedAuth } from "webiny/admin/self-hosted-auth";

export const Extensions = () => {
    return (
        <>
            {/* Self-hosted identity provider (login screen + JWT auth). Swap for another IdP if needed. */}
            <SelfHostedAuth />
            {/* Register extensions here. */}
        </>
    );
};
