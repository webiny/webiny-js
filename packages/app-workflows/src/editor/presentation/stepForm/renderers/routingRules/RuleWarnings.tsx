import React from "react";
import { Alert } from "@webiny/admin-ui";
import { ReactComponent as ErrorOutlineIcon } from "@webiny/icons/error_outline.svg";

export interface RuleWarningsProps {
    // The rule's position in the list, zero-based; each warning starts with `Rule {index + 1}: `.
    index: number;
    warnings: string[];
}

/*
 * The warnings of a rule below its fields (design 4.2): one warning alert per message, prefixed with
 * the rule number, with the design's outlined circle-exclamation icon.
 */
export const RuleWarnings = ({ index, warnings }: RuleWarningsProps) => {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-xs"}>
            {warnings.map((warning, position) => (
                <Alert
                    key={`${position}:${warning}`}
                    type={"warning"}
                    variant={"subtle"}
                    size={"sm"}
                    icon={<ErrorOutlineIcon />}
                >
                    {`Rule ${index + 1}: ${warning}`}
                </Alert>
            ))}
        </div>
    );
};
