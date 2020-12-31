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

export const configureWebsiteUrlTitle = t`Configure website URL`;

export const ConfigureWebsiteUrlMessage = ({ websiteUrl }) => {
    if (typeof websiteUrl !== "string") {
        return (
            <span className={confirmationMessageStyles}>
                {t`Public website website URL is missing. Please visit the {pageBuilderSettingsLink} and set it first.`(
                    {
                        pageBuilderSettingsLink: (
                            <Link
                                to={"/settings/page-builder/general"}
                            >{t`Page Builder settings`}</Link>
                        )
                    }
                )}
            </span>
        );
    }

    const isLocalHost = websiteUrl && websiteUrl.includes("localhost");
    return (
        <span className={confirmationMessageStyles}>
            {t`No site is running at`} <strong>{websiteUrl}</strong>.
            <br />
            <br />
            {isLocalHost ? (
                <span>
                    {t`Either start the server by running`}{" "}
                    <code>cd apps/site/code && yarn start</code>{" "}
                </span>
            ) : (
                <span>
                    {t`Either deploy the site by running`} <code>yarn webiny deploy apps/site</code>{" "}
                </span>
            )}
            <br />
            {t`or update the website URL by going into the`}{" "}
            <Link to={"/settings/page-builder/general"}>{t`page builder settings.`}</Link>
        </span>
    );
};

export const useConfigureWebsiteUrlDialog = (websiteUrl, onAccept = null) => {
    const { showDialog } = useDialog();

    return {
        showConfigureWebsiteUrlDialog: () => {
            showDialog(<ConfigureWebsiteUrlMessage websiteUrl={websiteUrl} />, {
                title: configureWebsiteUrlTitle,
                actions: {
                    accept: { label: t`Retry`, onClick: onAccept },
                    cancel: { label: t`Cancel` }
                }
            });
        }
    };
};
