import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";

export interface RuleWarningsProps {
    warnings: string[];
}

// The warnings of a rule below its fields (design 4.2): one warning alert per message, no prefix.
export const RuleWarnings = ({ warnings }: RuleWarningsProps) => {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-xs"}>
            {warnings.map((warning, index) => (
                <Alert key={`${index}:${warning}`} type={"warning"} variant={"subtle"}>
                    <Text size={"sm"}>{warning}</Text>
                </Alert>
            ))}
        </div>
    );
};
