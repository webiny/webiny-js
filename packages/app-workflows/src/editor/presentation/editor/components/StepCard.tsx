import React from "react";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as ArrowDownwardIcon } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as ArrowUpwardIcon } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as DragIndicatorIcon } from "@webiny/icons/drag_indicator.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import { getStepTypeIcon } from "./getStepTypeIcon.js";

export interface StepCardProps {
    step: StepCardVm;
    index: number;
    sortable: SortablePresenter.ItemProps;
    // A save is in flight: move and delete do nothing (Task 10).
    disabled?: boolean;
    onEdit(stepId: string): void;
    onMove(from: number, to: number): void;
    onDelete(stepId: string): void;
}

/*
 * One step of the flow (design README 3): number in the step colour, title, type tag, summary,
 * warning lines, error strip, up, down, edit and delete, and the drag handle. The sortable item
 * props make the card a drop target and the handle the drag source.
 */
export const StepCard = (props: StepCardProps) => {
    const { step, index, sortable } = props;
    const disabled = props.disabled === true;

    // One border colour at a time: `cn` does not merge `border-primary`-style classes.
    let borderClass = "border-neutral-muted";
    if (step.error !== null) {
        borderClass = "border-destructive-default";
    }
    if (sortable.isOver) {
        borderClass = "border-accent-default ring-lg ring-primary-dimmed";
    }
    const cardClass = cn(
        "relative flex flex-col gap-sm rounded-lg border-sm bg-neutral-base p-md shadow-sm",
        borderClass
    );
    let opacity = 1;
    if (sortable.isDragging) {
        opacity = 0.5;
    }

    let readOnlyTag: React.ReactNode = null;
    if (step.readOnly) {
        readOnlyTag = <Tag variant="neutral-light" content="Read-only" />;
    }

    let errorStrip: React.ReactNode = null;
    if (step.error !== null) {
        errorStrip = (
            <div role="alert" className="flex items-start gap-xs text-sm text-destructive-primary">
                <Icon icon={<ErrorIcon />} label="Error" size="sm" className="fill-destructive" />
                <span>{step.error}</span>
            </div>
        );
    }

    let warnings: React.ReactNode = null;
    if (step.warnings.length > 0) {
        warnings = (
            <div
                data-role="step-warnings"
                className="flex flex-col gap-xs border-t-sm border-neutral-subtle pt-sm"
            >
                {step.warnings.map((line, lineIndex) => {
                    const isError = line.severity === "error";
                    const rowClass = cn(
                        "flex items-start gap-xs text-sm",
                        isError ? "text-destructive-primary" : "text-neutral-primary"
                    );
                    return (
                        <div
                            key={`${lineIndex}:${line.text}`}
                            data-severity={line.severity}
                            className={rowClass}
                        >
                            <Icon
                                icon={isError ? <ErrorIcon /> : <WarningIcon />}
                                label={isError ? "Error" : "Warning"}
                                size="sm"
                                className={isError ? "fill-destructive" : "fill-warning"}
                            />
                            <span>{line.text}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            ref={sortable.ref}
            data-sortable-item=""
            data-step-id={step.id}
            data-testid={`step-card-${step.id}`}
            className={cardClass}
            style={{ opacity }}
        >
            <div className="flex items-center gap-sm">
                <span ref={sortable.handleRef} className="shrink-0 flex cursor-grab">
                    <Icon icon={<DragIndicatorIcon />} label="Drag to reorder" size="sm" />
                </span>
                <span
                    style={{ backgroundColor: step.color }}
                    className="shrink-0 flex items-center justify-center size-[28px] rounded-full text-sm font-semibold text-neutral-light"
                >
                    {step.number}
                </span>
                <button
                    type="button"
                    className="grow min-w-0 text-left"
                    onClick={() => props.onEdit(step.id)}
                >
                    <span data-role="step-title-row" className="flex items-center gap-xs min-w-0">
                        <Text as="span" size="md" className="block font-semibold truncate">
                            {step.title}
                        </Text>
                        <Tag
                            variant="neutral-base-outline"
                            icon={getStepTypeIcon(step.type)}
                            content={step.typeLabel}
                        />
                    </span>
                    <Text as="span" size="sm" className="block text-neutral-strong truncate">
                        {step.summary}
                    </Text>
                </button>
                {readOnlyTag}
                <div className="shrink-0 flex items-center gap-xxs">
                    <IconButton
                        aria-label="Move up"
                        variant="ghost"
                        size="sm"
                        icon={<ArrowUpwardIcon />}
                        disabled={disabled || !step.canMoveUp}
                        onClick={() => props.onMove(index, index - 1)}
                    />
                    <IconButton
                        aria-label="Move down"
                        variant="ghost"
                        size="sm"
                        icon={<ArrowDownwardIcon />}
                        disabled={disabled || !step.canMoveDown}
                        onClick={() => props.onMove(index, index + 1)}
                    />
                    <IconButton
                        aria-label="Edit step"
                        variant="ghost"
                        size="sm"
                        icon={<EditIcon />}
                        onClick={() => props.onEdit(step.id)}
                    />
                    <IconButton
                        aria-label="Delete step"
                        variant="ghost"
                        size="sm"
                        icon={<DeleteIcon />}
                        disabled={disabled}
                        onClick={() => props.onDelete(step.id)}
                    />
                </div>
            </div>
            {warnings}
            {errorStrip}
        </div>
    );
};
