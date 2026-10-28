import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
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
    const cardClass = cn(
        "flex w-full flex-col items-start gap-sm rounded-lg border-sm p-md text-left",
        !disabled && "border-neutral-muted hover:border-accent-default hover:bg-neutral-light",
        disabled && "border-neutral-dimmed bg-neutral-light cursor-not-allowed"
    );

    let description: React.ReactNode = null;
    if (option.description !== null) {
        description = (
            <Text as="span" size="sm" className="text-neutral-strong">
                {option.description}
            </Text>
        );
    }

    const reasonId = `step-type-${option.type}-reason`;
    let reason: React.ReactNode = null;
    if (option.reason !== null) {
        reason = (
            <span className="flex items-start gap-xs">
                <span aria-hidden="true" className="shrink-0 size-md fill-neutral-strong">
                    <LockIcon />
                </span>
                <Text as="span" size="sm" id={reasonId} className="text-neutral-strong">
                    {option.reason}
                </Text>
            </span>
        );
    }

    return (
        <button
            type="button"
            data-testid={`step-type-${option.type}`}
            disabled={disabled}
            aria-describedby={disabled && option.reason !== null ? reasonId : undefined}
            className={cardClass}
            onClick={() => onPick(option.type)}
        >
            <span
                aria-hidden="true"
                data-testid={`step-type-${option.type}-icon`}
                className={cn(
                    "shrink-0 flex items-center justify-center size-lg",
                    disabled ? "fill-neutral-disabled" : "fill-accent-default"
                )}
            >
                {getStepTypeIcon(option.type)}
            </span>
            <span className="flex flex-col gap-xxs">
                <Text as="span" size="md" className="font-semibold">
                    {option.label}
                </Text>
                {description}
                {reason}
            </span>
        </button>
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
            <div className="grid grid-cols-3 gap-sm-extra pb-md-extra">
                {options.map(option => (
                    <TypeCard key={option.type} option={option} onPick={onPick} />
                ))}
            </div>
        </Dialog>
    );
};
