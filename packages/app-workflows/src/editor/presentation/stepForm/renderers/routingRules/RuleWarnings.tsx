import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";

export interface RuleWarningsProps {
    // The rule's position in the list, zero-based; each warning starts with `Rule {index + 1}: `.
    index: number;
    warnings: string[];
}

// The warnings of a rule below its fields (design 4.2): one warning alert per message, prefixed with the rule number.
export const RuleWarnings = ({ index, warnings }: RuleWarningsProps) => {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-xs"}>
            {warnings.map((warning, position) => (
                <Alert key={`${position}:${warning}`} type={"warning"} variant={"subtle"}>
                    <Text size={"sm"}>{`Rule ${index + 1}: ${warning}`}</Text>
                </Alert>
            ))}
        </div>
    );
};
