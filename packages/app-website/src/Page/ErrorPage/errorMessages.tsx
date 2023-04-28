import { isLocalhost } from "@webiny/app/utils";
import React from "react";

const PB_NOT_INSTALLED = {
    title: "Installation incomplete",
    message: (
        <>
            <p>Looks like the Page Builder application is not installed.</p>
            <p>
                Before you continue, please open up the Admin application and complete the
                installation wizard.
            </p>
        </>
    )
};

const MISSING_TENANT_HEADER = {
    title: "Missing x-tenant HTTP header",
    message: (
        <>
            <p>
                Looks like the multi-tenancy feature is enabled, but current tenant could not be
                detected.
            </p>
            {isLocalhost() && (
                <p>
                    When developing locally, the easiest way to set the tenant is by adding the{" "}
                    <code>
                        <a href={"?__tenant=root"}>__tenant</a>
                    </code>{" "}
                    query parameter, or by assigning the <br />
                    <code>WEBINY_WEBSITE_TENANT_ID</code> environment variable via the{" "}
                    <code>.env</code> file, for example: <code>WEBINY_WEBSITE_TENANT_ID=root</code>.
                </p>
            )}
        </>
    )
};

const DEFAULT = {
    title: "An error occurred",
    message: <>The link is either broken or the page has been removed.</>
};

export const errorMessages = {
    PB_NOT_INSTALLED,
    MISSING_TENANT_HEADER,
    DEFAULT
};
