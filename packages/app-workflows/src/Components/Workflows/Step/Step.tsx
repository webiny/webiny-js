import React, { useCallback, useState } from "react";
import { Accordion, Card, Grid } from "@webiny/admin-ui";
import type { IWorkflowStep } from "~/types.js";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import { observer } from "mobx-react-lite";
import { Form } from "@webiny/form";
import { StepFormTitle } from "./form/StepFormTitle.js";
import { StepFormColor } from "./form/StepFormColor.js";
import { StepFormDescription } from "./form/StepFormDescription.js";
import { StepFormTeams } from "./form/StepFormTeams.js";
import { StepFormNotifications } from "./form/StepFormNotifications.js";
import { RemoveStep } from "./step/RemoveStep.js";

export interface IStepProps {
    step: IWorkflowStep;
    title?: string;
    onCancel?: () => void;
    onSave: (input: IWorkflowStep) => void;
    onRemove?: (step: Pick<IWorkflowStep, "id">) => void;
    onMoveUp?: (step: Pick<IWorkflowStep, "id">) => void;
    canMoveUp?: (step: Pick<IWorkflowStep, "id">) => boolean;
    onMoveDown?: (step: Pick<IWorkflowStep, "id">) => void;
    canMoveDown?: (step: Pick<IWorkflowStep, "id">) => boolean;
    open?: boolean;
}

const useEditing = (defaultValue = false) => {
    const [editing, setEditing] = useState(defaultValue);

    const startEditing = useCallback(() => {
        setEditing(true);
    }, []);
    const stopEditing = useCallback(() => {
        setEditing(false);
    }, []);
    return {
        editing,
        startEditing,
        stopEditing
    };
};

export const Step = observer(
    ({
        step,
        title,
        onCancel: initialOnCancel,
        onSave: initialOnSave,
        onRemove: initialOnRemove,
        onMoveUp,
        canMoveUp,
        onMoveDown,
        canMoveDown,
        open
    }: IStepProps) => {
        const { editing, stopEditing, startEditing } = useEditing(open);

        const onCancel = useCallback(() => {
            stopEditing();
            if (!initialOnCancel) {
                return;
            }
            initialOnCancel();
        }, [initialOnCancel]);

        const onRemove = useCallback(() => {
            if (!initialOnRemove) {
                return;
            }
            initialOnRemove(step);
        }, [step]);

        const moveUp = useCallback(() => {
            if (!canMoveUp || !onMoveUp || !canMoveUp(step)) {
                return;
            }
            onMoveUp(step);
        }, [onMoveUp, step]);

        const moveDown = useCallback(() => {
            if (!canMoveDown || !onMoveDown || !canMoveDown(step)) {
                return;
            }
            onMoveDown(step);
        }, [onMoveDown, step]);

        const onOpenChange = useCallback(() => {
            if (editing) {
                stopEditing();
                return;
            }
            startEditing();
        }, [step, editing]);

        const onSubmit = useCallback(
            (input: IWorkflowStep) => {
                initialOnSave(input);
                stopEditing();
            },
            [initialOnSave, step]
        );

        return (
            <Form<IWorkflowStep> data={step} onSubmit={onSubmit}>
                {({ submit: onFormSubmit }) => {
                    return (
                        <div className={"flex items-center justify-space-between gap-sm-plus"}>
                            {editing ? (
                                <>
                                    <Card
                                        className={"w-full"}
                                        padding="md"
                                        title={step.title || title}
                                        actionsPosition={"header"}
                                        variant="accent"
                                        actions={
                                            <>
                                                <Card.CancelAction
                                                    onClick={onCancel}
                                                    text={"Cancel"}
                                                />
                                                <Card.ConfirmAction
                                                    onClick={onFormSubmit}
                                                    text={"Save"}
                                                />
                                            </>
                                        }
                                    >
                                        <Grid gap={"comfortable"}>
                                            <Grid.Column span={10}>
                                                <StepFormTitle />
                                            </Grid.Column>
                                            <Grid.Column span={2}>
                                                <StepFormColor />
                                            </Grid.Column>
                                            <Grid.Column span={12}>
                                                <StepFormDescription />
                                            </Grid.Column>
                                            <Grid.Column span={12}>
                                                <StepFormTeams />
                                            </Grid.Column>
                                            <Grid.Column span={12}>
                                                <StepFormNotifications />
                                            </Grid.Column>
                                        </Grid>
                                    </Card>
                                    <div className={"size-lg"} />
                                </>
                            ) : (
                                <Accordion
                                    variant={"container"}
                                    background={"base"}
                                    border={"accent"}
                                >
                                    <Accordion.Item
                                        key={`step-${step.id}`}
                                        title={step.title || title}
                                        description={step.description}
                                        colorMark={step.color}
                                        onOpenChange={onOpenChange}
                                        actions={
                                            <>
                                                {canMoveUp && (
                                                    <Accordion.Item.Action
                                                        onClick={moveUp}
                                                        disabled={!canMoveUp(step)}
                                                        icon={<ArrowUp />}
                                                    />
                                                )}
                                                {canMoveDown && (
                                                    <Accordion.Item.Action
                                                        onClick={moveDown}
                                                        disabled={!canMoveDown(step)}
                                                        icon={<ArrowDown />}
                                                    />
                                                )}
                                                <Accordion.Item.Action.Separator />
                                                <RemoveStep step={step} onRemove={onRemove} />
                                            </>
                                        }
                                    >
                                        {null}
                                    </Accordion.Item>
                                </Accordion>
                            )}
                        </div>
                    );
                }}
            </Form>
        );
    }
);
