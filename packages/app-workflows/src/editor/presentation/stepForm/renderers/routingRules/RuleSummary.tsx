import React from "react";
import { Text } from "@webiny/admin-ui";

export interface RuleSummaryProps {
    text: string;
}

// The readable summary of a rule (design `ruleSummary`, R313).
export const RuleSummary = ({ text }: RuleSummaryProps) => {
    return (
        <Text as={"div"} size={"sm"} data-testid={"rule-summary"}>
            {text}
        </Text>
    );
};
