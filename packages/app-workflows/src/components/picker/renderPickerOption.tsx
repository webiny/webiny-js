import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { PickerOption } from "./PickerOption.js";
import { PickerOptionIconView } from "./PickerOptionIconView.js";

/*
 * One option row of the list: the icon column, the label (muted for a muted option), the sub line,
 * the option's warning and, on the right, its note (R332). The note stays inside the option, so it
 * is part of the row's accessible name, also on a disabled row.
 */
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

    let row: React.ReactNode = content;
    if (option.icon !== null) {
        row = (
            <div className={"flex items-start gap-sm"}>
                <PickerOptionIconView name={option.icon} muted={option.muted} />
                {content}
            </div>
        );
    }

    if (option.note === null) {
        return row;
    }

    return (
        <div className={"flex w-full items-start gap-sm"}>
            <div className={"min-w-0 flex-1"}>{row}</div>
            <Text
                size={"sm"}
                title={option.note}
                data-picker-note={""}
                className={"ml-auto max-w-[50%] shrink-0 truncate text-neutral-strong"}
            >
                {option.note}
            </Text>
        </div>
    );
};
