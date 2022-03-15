import React, { useState } from "react";
import get from "lodash/get";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "../../i18n";
import { OverlayWrapper, Pre } from "./StyledComponents";
import { ReactComponent as CloseIcon } from "./assets/close_24px.svg";

const t = i18n.ns("app/graphql/error-overlay");

const ENVIRONMENT_VARIABLES_ARTICLE_LINK =
    "https://www.webiny.com/docs/how-to-guides/environment-variables";

interface ErrorOverlayProps {
    query: string;
    networkError: {
        message: string;
        result?: {
            error?: {
                stack?: string;
            };
        };
    };
}
const ErrorOverlay: React.FC<ErrorOverlayProps> = props => {
    const { query, networkError } = props;
    const [open, setOpen] = useState(true);
    // Log error in browser's developer console for further inspection.
    console.error({ networkError });

    if (!open) {
        return null;
    }

    const stackTrace = get(networkError, "result.error.stack");

    return (
        <OverlayWrapper>
            <div className="inner">
                <div className="header">
                    <div className="header__title">
                        <Typography use={"headline4"}>{networkError.message}</Typography>
                    </div>
                    <div className="header__action">
                        <IconButton icon={<CloseIcon />} onClick={() => setOpen(false)} />
                    </div>
                </div>
                <div className="body">
                    <div className="body__summary">
                        <Typography
                            use={"subtitle1"}
                        >{t`Error occurred while executing operation:`}</Typography>
                        <Pre>
                            <code>{query}</code>
                        </Pre>
                    </div>
                    {stackTrace && (
                        <div className="body__description">
                            <Typography use={"subtitle1"}>{t`Complete stack trace:`}</Typography>
                            <Pre>
                                <code>{stackTrace}</code>
                            </Pre>
                        </div>
                    )}
                </div>
                <div className="footer">
                    <Typography use={"body2"}>
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

export default ErrorOverlay;
