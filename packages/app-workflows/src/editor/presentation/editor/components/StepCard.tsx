import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { ButtonGroup } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as ArrowDownwardIcon } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as ArrowUpwardIcon } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as DragIndicatorIcon } from "@webiny/icons/drag_indicator.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import { getStepTypeIcon } from "./getStepTypeIcon.js";

export interface StepCardProps {
    step: StepCardVm;
    index: number;
    // How many steps the flow has, for the drag handle's label.
    total: number;
    sortable: SortablePresenter.ItemProps;
    // A save is in flight: move and delete do nothing (Task 10).
    disabled?: boolean;
    onEdit(stepId: string): void;
    // The "+" next to the step: add a step after the one at `index`.
    onAddAfter(index: number): void;
    onMove(from: number, to: number): void;
    onDelete(stepId: string): void;
}

/*
 * One step of the flow as a row: the drag handle, the accordion item and the "+" add after button.
 * The item's header holds the number tag, the title, the type tag and the problem tags, with move
 * up, move down and delete as its actions; the expanded body holds the key and value rows, the
 * warning lines, the error and the Edit step button, the only way to open the step from the card.
 * The sortable item props make the row a drop target and the handle the drag source. Must render
 * inside an `Accordion`.
 */
export const StepCard = (props: StepCardProps) => {
    const { step, index, sortable } = props;
    const disabled = props.disabled === true;

    let readOnlyTag: React.ReactNode = null;
    if (step.readOnly) {
        readOnlyTag = <Tag variant="neutral-light" content="Read-only" />;
    }

    let problemTag: React.ReactNode = null;
    if (step.error !== null) {
        problemTag = <Tag variant="destructive" content="Error" />;
    } else if (step.warnings.length > 0) {
        const warningCount = step.warnings.length;
        const warningText = warningCount === 1 ? "1 warning" : `${warningCount} warnings`;
        problemTag = <Tag variant="warning-light" icon={<WarningIcon />} content={warningText} />;
    }

    const title = (
        <span data-role="step-title-row" className="flex items-center gap-xs min-w-0">
            <span data-role="step-number" className="flex shrink-0">
                <Tag variant="neutral-base-outline" content={String(step.number)} />
            </span>
            {/* A plain span keeps the accordion title's semibold weight (`Text` resets it). */}
            <span className="truncate">{step.title}</span>
            <Tag
                variant="neutral-base-outline"
                icon={getStepTypeIcon(step.type)}
                content={step.typeLabel}
            />
            {readOnlyTag}
            {problemTag}
        </span>
    );

    // The accordion trigger toggles on Enter and Space from any descendant, so the actions keep those keys.
    const actions = (
        <span className="flex items-center" onKeyDown={event => event.stopPropagation()}>
            <ButtonGroup variant="ghost" kind="icon" size="sm" label={`Actions for ${step.title}`}>
                <Accordion.Item.Action
                    aria-label={`Move ${step.title} up`}
                    data-role="move-up"
                    icon={<ArrowUpwardIcon />}
                    disabled={disabled || !step.canMoveUp}
                    onClick={() => props.onMove(index, index - 1)}
                />
                <Accordion.Item.Action
                    aria-label={`Move ${step.title} down`}
                    data-role="move-down"
                    icon={<ArrowDownwardIcon />}
                    disabled={disabled || !step.canMoveDown}
                    onClick={() => props.onMove(index, index + 1)}
                />
                <Accordion.Item.Action
                    aria-label={`Delete ${step.title}`}
                    icon={<DeleteIcon />}
                    disabled={disabled}
                    onClick={() => props.onDelete(step.id)}
                />
            </ButtonGroup>
        </span>
    );

    const hasProblem = step.error !== null || step.warnings.length > 0;
    // Changes whenever the error or the warnings change, so a new problem is noticed.
    const problemKey = JSON.stringify([step.error, step.warnings.map(line => line.text)]);
    const [open, setOpen] = useState(hasProblem);
    const problemKeyRef = useRef(problemKey);
    // A problem that appears or changes later opens the item, so it is never hidden.
    useEffect(() => {
        if (hasProblem && problemKey !== problemKeyRef.current) {
            setOpen(true);
        }
        problemKeyRef.current = problemKey;
    }, [hasProblem, problemKey]);

    let descriptionText: React.ReactNode = null;
    if (step.description !== null) {
        descriptionText = (
            <Text as="div" size="md">
                {step.description}
            </Text>
        );
    }
    // Two aligned columns: a fixed-width muted label and the value (design: 112px label column).
    const detailRows = step.details.map(row => (
        <div key={row.label} data-role="step-detail-row" className="flex gap-md">
            <Text as="span" size="sm" className="w-28 shrink-0 text-neutral-strong">
                {row.label}
            </Text>
            <Text as="span" size="sm" className="min-w-0">
                {row.value}
            </Text>
        </div>
    ));
    let detailGrid: React.ReactNode = null;
    if (detailRows.length > 0) {
        detailGrid = <div className="grid gap-y-xs">{detailRows}</div>;
    }

    return (
        <div
            ref={sortable.ref}
            data-sortable-item=""
            data-step-id={step.id}
            data-testid={`step-card-${step.id}`}
            className="flex items-start gap-sm"
        >
            {/* Centred on the item's collapsed header (62px tall), so it stays put when the item opens. */}
            <div data-role="drag-handle" className="flex shrink-0 pt-md-extra">
                <span ref={sortable.handleRef} className="flex">
                    <IconButton
                        aria-label={`Drag to reorder ${step.title} (step ${step.number} of ${props.total})`}
                        variant="ghost"
                        size="sm"
                        icon={<DragIndicatorIcon />}
                    />
                </span>
            </div>
            <div className="min-w-0 grow">
                <Accordion.Item
                    title={title}
                    colorMark={step.color}
                    actions={actions}
                    open={open}
                    onOpenChange={setOpen}
                >
                    <div data-role="step-details" className="flex flex-col gap-sm">
                        {descriptionText}
                        {detailGrid}
                        {step.warnings.map((line, lineIndex) => (
                            <Alert
                                key={`${lineIndex}:${line.text}`}
                                data-severity={line.severity}
                                type={line.severity === "error" ? "danger" : "warning"}
                                variant="subtle"
                                size="sm"
                            >
                                {line.text}
                            </Alert>
                        ))}
                        {step.error !== null ? (
                            <Alert type="danger" variant="subtle" size="sm">
                                {step.error}
                            </Alert>
                        ) : null}
                        <div className="flex">
                            <Button
                                variant="secondary"
                                size="sm"
                                text="Edit step"
                                icon={<EditIcon />}
                                onClick={() => props.onEdit(step.id)}
                            />
                        </div>
                    </div>
                </Accordion.Item>
            </div>
            {/* Centred on the item's collapsed header (62px tall), so it stays put when the item opens. */}
            <div data-role="add-after" className="shrink-0 pt-md-extra">
                <IconButton
                    aria-label={`Add a step after ${step.title}`}
                    variant="ghost"
                    size="sm"
                    icon={<AddIcon />}
                    disabled={disabled}
                    onClick={() => props.onAddAfter(index)}
                />
            </div>
        </div>
    );
};
