import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Alert } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as ArrowDownwardIcon } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as ArrowUpwardIcon } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
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
 * One step of the flow as an accordion item: the number, title, type tag and meta line in the
 * header with move up, move down, edit and delete as the item's actions; the warning lines and the
 * error in the expanded body. The sortable item props make the item a drop target and the
 * accordion's drag handle the drag source. Must render inside an `Accordion`.
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
        problemTag = <Tag variant="warning" content="Warning" />;
    }

    const title = (
        <span data-role="step-title-row" className="flex items-center gap-xs min-w-0">
            <Text as="span" size="md" className="truncate">
                {step.title}
            </Text>
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
        <span className="flex items-center gap-xs" onKeyDown={event => event.stopPropagation()}>
            <Accordion.Item.Action
                aria-label="Move up"
                icon={<ArrowUpwardIcon />}
                disabled={disabled || !step.canMoveUp}
                onClick={() => props.onMove(index, index - 1)}
            />
            <Accordion.Item.Action
                aria-label="Move down"
                icon={<ArrowDownwardIcon />}
                disabled={disabled || !step.canMoveDown}
                onClick={() => props.onMove(index, index + 1)}
            />
            <Accordion.Item.Action
                aria-label="Edit step"
                icon={<EditIcon />}
                onClick={() => props.onEdit(step.id)}
            />
            <Accordion.Item.Action
                aria-label="Delete step"
                icon={<DeleteIcon />}
                disabled={disabled}
                onClick={() => props.onDelete(step.id)}
            />
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
    // A step with nothing to expand shows its meta line, so every item keeps the same chevron.
    let summaryText: React.ReactNode = null;
    if (step.description === null && !hasProblem) {
        summaryText = (
            <Text as="div" size="md">
                {step.summary}
            </Text>
        );
    }

    return (
        <div
            ref={sortable.ref}
            data-sortable-item=""
            data-step-id={step.id}
            data-testid={`step-card-${step.id}`}
        >
            <Accordion.Item
                title={title}
                description={step.summary}
                colorMark={step.color}
                icon={
                    <span data-role="step-number" className="flex w-xl shrink-0 justify-center">
                        <Text as="span">{step.number}</Text>
                    </span>
                }
                actions={actions}
                draggable={true}
                dragHandleRef={sortable.handleRef}
                open={open}
                onOpenChange={setOpen}
            >
                <div data-role="step-details" className="flex flex-col gap-xs">
                    {descriptionText}
                    {summaryText}
                    {step.warnings.map((line, lineIndex) => (
                        <Alert
                            key={`${lineIndex}:${line.text}`}
                            data-severity={line.severity}
                            type={line.severity === "error" ? "danger" : "warning"}
                            variant="subtle"
                        >
                            <Text as="span">{line.text}</Text>
                        </Alert>
                    ))}
                    {step.error !== null ? (
                        <Alert type="danger" variant="subtle">
                            <Text as="span">{step.error}</Text>
                        </Alert>
                    ) : null}
                </div>
            </Accordion.Item>
        </div>
    );
};
