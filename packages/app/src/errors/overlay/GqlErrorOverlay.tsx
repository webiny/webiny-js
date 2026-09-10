import React from "react";
import get from "lodash/get.js";
import { Typography } from "./Typography.js";
import { i18n } from "../../i18n/index.js";
import { Pre } from "./StyledComponents.js";
import { ErrorOverlay } from "./ErrorOverlay.js";

const t = i18n.ns("app/graphql/error-overlay");

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

export const GqlErrorOverlay = (props: ErrorOverlayProps) => {
    const { query, networkError } = props;
    const stackTrace = get(networkError, "result.error.stack");

    const title = networkError.message;

    const message = (
        <>
            <Typography use={"subtitle"}>{t`Error occurred while executing operation:`}</Typography>
            <Pre>
                <code>{query}</code>
            </Pre>
        </>
    );

    let description: React.ReactNode = null;
    if (stackTrace) {
        description = (
            <>
                <Typography use={"subtitle"}>{t`Complete stack trace:`}</Typography>
                <Pre>
                    <code>{stackTrace}</code>
                </Pre>
            </>
        );
    }

    return <ErrorOverlay title={title} message={message} description={description} />;
};
