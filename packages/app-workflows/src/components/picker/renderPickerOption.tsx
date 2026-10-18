import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { PickerOption } from "./PickerOption.js";
import { PickerOptionIconView } from "./PickerOptionIconView.js";

// One option row of the list: the icon column, the label (muted for a muted option), the sub line and the option's warning.
export const renderPickerOption = (option: PickerOption): React.ReactNode => {
    let labelClass: string | undefined = undefined;
    if (option.muted) {
        labelClass = "text-neutral-strong";
    }

    const content = (
        <div className={"flex flex-col gap-xxs whitespace-normal"}>
            <Text size={"md"} className={labelClass}>
                {option.label}
            </Text>
            {option.description !== null && (
                <Text size={"sm"} className={"text-neutral-strong"}>
                    {option.description}
                </Text>
            )}
            {option.warning !== null && (
                <span className={"flex items-center gap-xs text-warning-xstrong"}>
                    <Icon
                        icon={<WarningIcon />}
                        label={"Warning"}
                        size={"sm"}
                        className={"fill-warning-xstrong"}
                    />
                    <Text size={"sm"}>{option.warning}</Text>
                </span>
            )}
        </div>
    );

    if (option.icon === null) {
        return content;
    }

    return (
        <div className={"flex items-start gap-sm"}>
            <PickerOptionIconView name={option.icon} muted={option.muted} />
            {content}
        </div>
    );
};
