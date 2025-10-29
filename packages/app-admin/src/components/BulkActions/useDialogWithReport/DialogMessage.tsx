import React from "react";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error_outline.svg";
import { ReactComponent as SuccessIcon } from "@webiny/icons/check_circle_outline.svg";
import { List, Icon, cn } from "@webiny/admin-ui";
import type { ShowResultsDialogParams } from "./index.js";

type ResultDialogMessageProps = Pick<ShowResultsDialogParams, "results" | "message">;

export const ResultDialogMessage = ({ results, message }: ResultDialogMessageProps) => {
    return (
        <>
            {message && <div className={"mb-md"}>{message}</div>}
            <List>
                {results.map((result, index) => (
                    <List.Item
                        key={`item-${index}`}
                        title={result.title}
                        description={result.message}
                        icon={
                            <Icon
                                icon={result.status === "success" ? <SuccessIcon /> : <ErrorIcon />}
                                label={result.status}
                                className={cn(
                                    result.status === "success"
                                        ? "fill-success"
                                        : "fill-destructive"
                                )}
                            />
                        }
                    />
                ))}
            </List>
        </>
    );
};
