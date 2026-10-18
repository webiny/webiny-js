import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
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
        "flex w-full items-start gap-sm rounded-lg border-sm p-md text-left",
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

    let reason: React.ReactNode = null;
    if (option.reason !== null) {
        reason = (
            <Text as="span" size="sm" className="text-neutral-primary">
                {option.reason}
            </Text>
        );
    }

    return (
        <button
            type="button"
            data-testid={`step-type-${option.type}`}
            disabled={disabled}
            className={cardClass}
            onClick={() => onPick(option.type)}
        >
            <span
                aria-hidden="true"
                className="shrink-0 flex items-center justify-center size-xl rounded-md bg-neutral-dimmed"
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
            title="Add step"
            description="Choose who or what does this step. You can't change the type later."
        >
            <div className="flex flex-col gap-sm">
                {options.map(option => (
                    <TypeCard key={option.type} option={option} onPick={onPick} />
                ))}
            </div>
        </Dialog>
    );
};
