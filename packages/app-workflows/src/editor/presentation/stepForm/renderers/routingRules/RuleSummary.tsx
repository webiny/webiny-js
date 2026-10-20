import React from "react";
import { Text } from "@webiny/admin-ui";

export interface RuleSummaryProps {
    text: string;
}

// The readable summary of a rule in its neutral box (design `ruleSummary`, R313).
export const RuleSummary = ({ text }: RuleSummaryProps) => {
    return (
        <div data-testid={"rule-summary"} className={"rounded-sm bg-neutral-light px-sm py-xs"}>
            <Text size={"sm"} className={"text-neutral-strong"}>
                {text}
            </Text>
        </div>
    );
};
