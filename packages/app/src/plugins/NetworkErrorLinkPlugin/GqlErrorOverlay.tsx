import React from "react";
import get from "lodash/get.js";
import { Typography } from "./Typography.js";
import { i18n } from "../../i18n/index.js";
import { ErrorOverlay } from "./ErrorOverlay.js";

const t = i18n.ns("app/graphql/error-overlay");

const Pre = ({ children }: { children: React.ReactNode }) => (
    <pre
        className={
            "relative block p-[0.5em] my-[0.5em] overflow-x-auto whitespace-pre-wrap rounded-[0.25rem] bg-[rgba(251,245,180,0.3)] text-inherit"
        }
    >
        <code className={"font-mono text-[0.85rem] leading-[1rem]"}>{children}</code>
    </pre>
);

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
            <Pre>{query}</Pre>
        </>
    );

    let description: React.ReactNode = null;
    if (stackTrace) {
        description = (
            <>
                <Typography use={"subtitle"}>{t`Complete stack trace:`}</Typography>
                <Pre>{stackTrace}</Pre>
            </>
        );
    }

    return <ErrorOverlay title={title} message={message} description={description} />;
};
