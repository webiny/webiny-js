import React from "react";
import { css } from "emotion";
import {i18n} from "@webiny/app/i18n";

const t = i18n.ns("app-page-builder/utils");

const confirmationMessageStyles = css({
    "& code": {
        backgroundColor: "var(--mdc-theme-background)",
        padding: "0px 8px"
    }
});

export const configureDomainTitle = t`Configure domain`;

export const ConfigureDomainMessage = ({ domain }) => (
    <span className={confirmationMessageStyles}>
        No site is running at <strong>{domain}</strong>
        <br />
        Either start the server by <code>cd apps/site && yarn start</code>
        <br />
        or update the domain by going into{" "}
        <a href={"/settings/page-builder/general"}>page builder settings</a>
    </span>
);
