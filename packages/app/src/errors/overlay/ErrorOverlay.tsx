import React, { useState } from "react";
import { Typography } from "./Typography.js";
import { i18n } from "../../i18n/index.js";
import { OverlayWrapper } from "./StyledComponents.js";
import { ReactComponent as CloseIcon } from "./assets/close_24px.svg";

const t = i18n.ns("app/graphql/error-overlay");

const ENVIRONMENT_VARIABLES_ARTICLE_LINK =
    "https://www.webiny.com/docs/how-to-guides/environment-variables";

type ErrorOverlayProps = Partial<{
    title: React.ReactNode;
    message: React.ReactNode;
    description: React.ReactNode;
    closeable?: boolean;
}>;

export const ErrorOverlay = (props: ErrorOverlayProps) => {
    const { title = "An error occurred", message, description, closeable } = props;
    const [open, setOpen] = useState(true);
    if (!open) {
        return null;
    }

    return (
        <OverlayWrapper>
            <div className="inner">
                <div className="header">
                    <div className="header__title">
                        <Typography use={"headline"}>{title}</Typography>
                    </div>
                    {closeable !== false && (
                        <div className="header__action">
                            <span onClick={() => setOpen(false)}>
                                <CloseIcon />
                            </span>
                        </div>
                    )}
                </div>
                <div className="body">
                    <div className="body__summary">{message}</div>
                    {description && <div className="body__description">{description}</div>}
                </div>
                <div className="footer">
                    <Typography use={"body"}>
                        {t`
                        This screen is only visible if {message} environment variable is set.
                        Read more about it in the {link}. `({
                            message: <span className={"highlight"}>`REACT_APP_DEBUG=true`</span>,
                            link: (
                                <a
                                    href={ENVIRONMENT_VARIABLES_ARTICLE_LINK}
                                    target={"_blank"}
                                    rel={"noreferrer noopener"}
                                >
                                    environment variables article
                                </a>
                            )
                        })}
                        <br />
                        {t`Open your browser's developer console to further inspect this error.`}
                    </Typography>
                </div>
            </div>
        </OverlayWrapper>
    );
};
