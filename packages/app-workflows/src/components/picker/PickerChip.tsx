import React from "react";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { PickerOption } from "./PickerOption.js";

export interface PickerChipProps {
    option: PickerOption;
    disabled: boolean;
    onRemove(id: string): void;
}

// A chosen item of the multi picker; an option with a warning gets a warning icon and the text as title.
export const PickerChip = ({ option, disabled, onRemove }: PickerChipProps) => {
    if (option.warning === null) {
        return (
            <Tag
                variant={"neutral-muted"}
                content={option.label}
                disabled={disabled}
                onDismiss={() => onRemove(option.id)}
            />
        );
    }

    return (
        <Tag
            variant={"warning"}
            title={option.warning}
            icon={<WarningIcon />}
            content={option.label}
            disabled={disabled}
            onDismiss={() => onRemove(option.id)}
        />
    );
};
