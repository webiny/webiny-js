import React from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
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
            {t`No site is running at`} <strong>{domain}</strong>.
            <br />
            <br />
            {isLocalHost ? (
                <span>
                    {t`Either start the server by running`} <code>cd apps/site && yarn start</code>{" "}
                </span>
            ) : (
                <span>
                    {t`Either deploy the site by running`} <code>yarn webiny deploy apps</code>{" "}
                </span>
            )}
            <br />
            {t`or update the domain by going into the`}{" "}
            <Link to={"/settings/page-builder/general"}>{t`page builder settings.`}</Link>
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
                    accept: { label: t`Retry`, onClick: onAccept },
                    cancel: { label: t`Cancel` }
                }
            });
        }
    };
};
