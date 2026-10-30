import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { ScrollRequestVm } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowFlowVm } from "~/editor/presentation/editor/abstractions.js";
import { StepCard } from "./StepCard.js";

export interface WorkflowFlowProps {
    flow: WorkflowFlowVm;
    scrollRequest: ScrollRequestVm | null;
    // A save is in flight: add, move, delete and drag do nothing (Task 10).
    disabled?: boolean;
    onAddStep(index: number): void;
    onEditStep(stepId: string): void;
    onMoveStep(from: number, to: number): void;
    onDeleteStep(stepId: string): void;
}

interface MoveRequest {
    stepId: string;
    direction: "up" | "down";
}

// The scroll requests already handled: a remounted flow must not scroll for them again.
const handledScrollRequests = new WeakSet<ScrollRequestVm>();

/*
 * The step list (design README 3, UI-11): one accordion item per step, then one Add step button.
 * Steps reorder by drag (`SortablePresenter`, one instance per flow) or by the items' up and down
 * actions. A new `scrollRequest` scrolls its item into view (R276).
 */
export const WorkflowFlow = createReactiveComponent(function WorkflowFlow(
    props: WorkflowFlowProps
) {
    const { flow, scrollRequest } = props;
    const { steps, stepsError } = flow;
    const disabled = props.disabled === true;
    const container = useContainer();
    const rootRef = useRef<HTMLDivElement>(null);

    const onMoveStepRef = useRef(props.onMoveStep);
    onMoveStepRef.current = props.onMoveStep;
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;

    const moveRequestRef = useRef<MoveRequest | null>(null);
    const [announcement, setAnnouncement] = useState("");

    const handleMove = (from: number, to: number) => {
        const moved = steps[from];
        if (moved !== undefined) {
            moveRequestRef.current = { stepId: moved.id, direction: to > from ? "down" : "up" };
        }
        props.onMoveStep(from, to);
    };

    const sortable = useMemo(() => {
        const presenter = container.resolve(SortablePresenter);
        presenter.init({
            type: "workflow-steps",
            onReorder: (from, to) => {
                // Edits do nothing while a save is in flight.
                if (disabledRef.current) {
                    return;
                }
                onMoveStepRef.current(from, to);
            }
        });
        return presenter;
    }, [container]);

    useEffect(() => {
        return () => sortable.dispose();
    }, [sortable]);

    let scrollStepId: string | null = null;
    let scrollNonce: number | null = null;
    if (scrollRequest !== null) {
        scrollStepId = scrollRequest.stepId;
        scrollNonce = scrollRequest.nonce;
    }

    const orderKey = steps.map(step => step.id).join("|");

    // After a keyboard move: announce the new position and keep focus on the moved card's button.
    useEffect(() => {
        const request = moveRequestRef.current;
        if (request === null || rootRef.current === null) {
            return;
        }
        const index = steps.findIndex(step => step.id === request.stepId);
        if (index === -1) {
            return;
        }
        moveRequestRef.current = null;
        setAnnouncement(`Step moved to position ${index + 1} of ${steps.length}.`);

        const step = steps[index];
        let label = "Move down";
        if (request.direction === "up") {
            label = "Move up";
        }
        const blocked = request.direction === "up" ? !step.canMoveUp : !step.canMoveDown;
        if (blocked) {
            label = label === "Move up" ? "Move down" : "Move up";
        }
        const cards = rootRef.current.querySelectorAll("[data-step-id]");
        for (const card of Array.from(cards)) {
            if (card.getAttribute("data-step-id") === request.stepId) {
                const button = card.querySelector<HTMLElement>(`[aria-label="${label}"]`);
                button?.focus();
                return;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderKey]);

    useEffect(() => {
        if (scrollStepId === null || rootRef.current === null) {
            return;
        }
        if (scrollRequest !== null) {
            if (handledScrollRequests.has(scrollRequest)) {
                return;
            }
            handledScrollRequests.add(scrollRequest);
        }

        const cards = rootRef.current.querySelectorAll("[data-step-id]");
        for (const card of Array.from(cards)) {
            if (card.getAttribute("data-step-id") === scrollStepId) {
                card.scrollIntoView({ block: "center", behavior: "smooth" });
                return;
            }
        }
    }, [scrollStepId, scrollNonce]);

    const addStep = (
        <Button
            variant="primary"
            text="Add step"
            icon={<AddIcon />}
            disabled={disabled}
            onClick={() => props.onAddStep(steps.length)}
        />
    );

    if (steps.length === 0) {
        let error: React.ReactNode = null;
        if (stepsError !== null) {
            error = (
                <Alert type="danger" variant="subtle">
                    {stepsError}
                </Alert>
            );
        }
        return (
            <div
                ref={rootRef}
                data-role="flow-column"
                className="mx-auto flex w-full max-w-2xl flex-col gap-md"
            >
                {error}
                <EmptyState
                    data-testid="no-steps"
                    title="No steps yet"
                    description={`Add the first step: who or what reviews ${flow.modelName} content before it can be published.`}
                    actions={addStep}
                />
            </div>
        );
    }

    return (
        <div
            ref={rootRef}
            data-role="flow-column"
            className="mx-auto flex w-full max-w-2xl flex-col gap-md"
        >
            <div role="status" aria-live="polite" className="sr-only">
                {announcement}
            </div>
            <Accordion variant="container">
                {steps.map((step, index) => (
                    <StepCard
                        key={step.id}
                        step={step}
                        index={index}
                        sortable={sortable.getItemProps(index)}
                        disabled={disabled}
                        onEdit={props.onEditStep}
                        onMove={handleMove}
                        onDelete={props.onDeleteStep}
                    />
                ))}
            </Accordion>
            <div className="flex">{addStep}</div>
        </div>
    );
});
