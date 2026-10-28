import React from "react";
import { Icon } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
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
    let label: React.ReactNode = <Text size={"md"}>{option.label}</Text>;
    if (option.muted) {
        label = (
            <FormComponentDescription
                className={"mb-0"}
                text={<Text size={"md"}>{option.label}</Text>}
            />
        );
    }

    const content = (
        <div className={"flex flex-col gap-xxs whitespace-normal"}>
            {label}
            {option.description !== null && (
                <FormComponentDescription
                    className={"mb-0"}
                    text={<Text size={"sm"}>{option.description}</Text>}
                />
            )}
            {option.warning !== null && (
                <span className={"flex items-center gap-xs"}>
                    <Icon icon={<WarningIcon />} label={"Warning"} size={"sm"} />
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
            <FormComponentNote
                className={"ml-auto mt-0 max-w-1/2 shrink-0 truncate"}
                text={
                    <Text size={"sm"} title={option.note} data-picker-note={""}>
                        {option.note}
                    </Text>
                }
            />
        </div>
    );
};
