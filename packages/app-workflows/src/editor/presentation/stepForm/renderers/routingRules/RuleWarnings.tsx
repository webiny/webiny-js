import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";

export interface RuleWarningsProps {
    warnings: string[];
}

// The warnings of a rule below its fields (design 4.2): the warning icon and the message, no prefix.
export const RuleWarnings = ({ warnings }: RuleWarningsProps) => {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-xs"}>
            {warnings.map((warning, index) => (
                <div key={`${index}:${warning}`} className={"flex items-start gap-xs"}>
                    <Icon
                        icon={<WarningIcon />}
                        label={"Warning"}
                        size={"sm"}
                        className={"fill-warning-xstrong"}
                    />
                    <Text size={"sm"} className={"text-warning-xstrong"}>
                        {warning}
                    </Text>
                </div>
            ))}
        </div>
    );
};
