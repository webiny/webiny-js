import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";

const t = i18n.ns("app-page-builder/utils");

const confirmationMessageStyles = css({
    "& code": {
        backgroundColor: "var(--mdc-theme-background)",
        padding: "0px 8px"
    }
});

export const configureDomainTitle = t`Configure domain`;

export const ConfigureDomainMessage = ({ domain }) => {
    const isLocalHost = domain && domain.includes("localhost");
    return (
        <span className={confirmationMessageStyles}>
            No site is running at <strong>{domain}</strong>
            <br />
            {isLocalHost ? (
                <span>
                    Either start the server by <code>cd apps/site && yarn start</code>{" "}
                </span>
            ) : (
                <span>
                    Either deploy the site by running <code>yarn webiny deploy apps</code>{" "}
                </span>
            )}
            <br />
            or update the domain by going into{" "}
            <a href={"/settings/page-builder/general"}>page builder settings</a>
        </span>
    );
};

export const useConfigureDomainDialog = (domain, onAccept = null) => {
    const { showDialog } = useDialog();

    return {
        showConfigureDomainDialog: () => {
            showDialog(<ConfigureDomainMessage domain={domain} />, {
                title: configureDomainTitle,
                actions: {
                    accept: { label: "Refresh", onClick: onAccept },
                    cancel: { label: "Cancel" }
                }
            });
        }
    };
};
