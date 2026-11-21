import React from "react";
import { Alert } from "@webiny/admin-ui";
import { ReactComponent as ErrorOutlineIcon } from "@webiny/icons/error_outline.svg";

export interface StepDrawerWarningsProps {
    warnings: string[];
}

/*
 * The step's own warnings at the end of the Assignment tab (design: a pale-yellow alert with the
 * outlined circle-exclamation icon): one warning alert per line. Errors stay at their fields.
 */
export const StepDrawerWarnings = ({ warnings }: StepDrawerWarningsProps) => {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div data-testid={"step-drawer-warnings"} className={"flex flex-col gap-xs"}>
            {warnings.map((warning, position) => (
                <Alert
                    key={`${position}:${warning}`}
                    type={"warning"}
                    variant={"subtle"}
                    size={"sm"}
                    icon={<ErrorOutlineIcon />}
                >
                    {warning}
                </Alert>
            ))}
        </div>
    );
};
