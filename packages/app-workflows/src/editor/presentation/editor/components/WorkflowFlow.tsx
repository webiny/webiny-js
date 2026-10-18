import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { Button } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { ReactComponent as PublicIcon } from "@webiny/icons/public.svg";
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

interface EndCardProps {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    description: string;
}

interface ConnectorProps {
    index: number;
    disabled: boolean;
    onAdd(index: number): void;
}

const EndCard = ({ icon, iconClass, title, description }: EndCardProps) => {
    return (
        <div className="flex items-center gap-sm rounded-lg border-sm border-dashed border-neutral-muted p-md">
            <span aria-hidden="true" className={cn("shrink-0 flex", iconClass)}>
                {icon}
            </span>
            <div className="flex flex-col">
                <Text as="div" size="md" className="font-semibold">
                    {title}
                </Text>
                <Text as="div" size="sm" className="text-neutral-strong">
                    {description}
                </Text>
            </div>
        </div>
    );
};

const Connector = ({ index, disabled, onAdd }: ConnectorProps) => {
    return (
        <div className="flex justify-center py-xs">
            <IconButton
                aria-label="Add step"
                variant="tertiary"
                size="sm"
                className="rounded-full"
                icon={<AddIcon />}
                disabled={disabled}
                onClick={() => onAdd(index)}
            />
        </div>
    );
};

const DraftCard = () => {
    return (
        <EndCard
            icon={<EditNoteIcon />}
            iconClass=""
            title="Draft"
            description="The author saves a revision and requests a review."
        />
    );
};

const PublishedCard = () => {
    return (
        <EndCard
            icon={<PublicIcon />}
            iconClass="fill-success"
            title="Published"
            description="Publishing is allowed once every step approves."
        />
    );
};

/*
 * The vertical flow (design README 3, UI-11): Draft, the numbered step cards with a + before each
 * and after the last, Published. Steps reorder by drag (`SortablePresenter`, one instance per flow)
 * or by the cards' up and down buttons. A new `scrollRequest` scrolls its card into view (R276).
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

    useEffect(() => {
        if (scrollStepId === null || rootRef.current === null) {
            return;
        }

        const cards = rootRef.current.querySelectorAll("[data-step-id]");
        for (const card of Array.from(cards)) {
            if (card.getAttribute("data-step-id") === scrollStepId) {
                card.scrollIntoView({ block: "center", behavior: "smooth" });
                return;
            }
        }
    }, [scrollStepId, scrollNonce]);

    if (steps.length === 0) {
        const boxClass = cn(
            "flex flex-col items-center gap-sm rounded-lg border-sm border-dashed p-lg",
            stepsError === null && "border-neutral-muted",
            stepsError !== null && "border-destructive-default"
        );
        let error: React.ReactNode = null;
        if (stepsError !== null) {
            error = (
                <Text size="sm" className="text-destructive-primary">
                    {stepsError}
                </Text>
            );
        }
        return (
            <div ref={rootRef} className="mx-auto flex w-full max-w-[680px] flex-col gap-md">
                <DraftCard />
                <div data-testid="no-steps" className={boxClass}>
                    <Text size="md" className="font-semibold">
                        No steps yet
                    </Text>
                    {error}
                    <Button
                        variant="secondary"
                        text="Add step"
                        disabled={disabled}
                        onClick={() => props.onAddStep(0)}
                    />
                </div>
                <PublishedCard />
            </div>
        );
    }

    return (
        <div ref={rootRef} className="mx-auto flex w-full max-w-[680px] flex-col">
            <DraftCard />
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <Connector index={index} disabled={disabled} onAdd={props.onAddStep} />
                    <StepCard
                        step={step}
                        index={index}
                        sortable={sortable.getItemProps(index)}
                        disabled={disabled}
                        onEdit={props.onEditStep}
                        onMove={props.onMoveStep}
                        onDelete={props.onDeleteStep}
                    />
                </React.Fragment>
            ))}
            <Connector index={steps.length} disabled={disabled} onAdd={props.onAddStep} />
            <PublishedCard />
        </div>
    );
});
