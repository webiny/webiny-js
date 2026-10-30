import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import { getStepTypeIcon } from "./getStepTypeIcon.js";

export interface StepTypePickerProps {
    options: StepTypeOption[];
    onPick(type: string): void;
    onClose(): void;
}

interface TypeCardProps {
    option: StepTypeOption;
    onPick(type: string): void;
}

const TypeCard = ({ option, onPick }: TypeCardProps) => {
    const disabled = !option.addable;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget || disabled) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPick(option.type);
        }
    };

    const reasonId = `step-type-${option.type}-reason`;
    let reason: React.ReactNode = null;
    if (option.reason !== null) {
        reason = (
            <span className="flex items-start gap-xs">
                <Icon icon={<LockIcon />} label="" size="sm" />
                <Text as="span" size="sm" id={reasonId}>
                    {option.reason}
                </Text>
            </span>
        );
    }

    let description: React.ReactNode = null;
    if (option.description !== null || reason !== null) {
        description = (
            <span className="flex flex-col gap-xxs">
                {option.description}
                {reason}
            </span>
        );
    }

    let icon: React.ReactNode = undefined;
    const typeIcon = getStepTypeIcon(option.type);
    if (typeIcon !== null) {
        icon = <Icon icon={typeIcon} label="" size="md" />;
    }

    return (
        <List.Item
            role="button"
            data-testid={`step-type-${option.type}`}
            aria-disabled={disabled ? "true" : undefined}
            aria-describedby={disabled && option.reason !== null ? reasonId : undefined}
            disabled={disabled}
            icon={icon}
            title={option.label}
            description={description}
            onClick={disabled ? undefined : () => onPick(option.type)}
            onKeyDown={handleKeyDown}
        />
    );
};

/*
 * The step type picker (design README UI-12): one card per type from `listStepTypes`, in the order
 * returned. A type that cannot be added is a disabled card with its reason (D122, QBZ-97).
 */
export const StepTypePicker = ({ options, onPick, onClose }: StepTypePickerProps) => {
    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    onClose();
                }
            }}
            size="lg"
            title="Add step"
            description="Choose who or what does this step. You can't change the type later."
        >
            <List>
                {options.map(option => (
                    <TypeCard key={option.type} option={option} onPick={onPick} />
                ))}
            </List>
        </Dialog>
    );
};
