import React, { useCallback, useState } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Color } from "./Color.js";
import { StepForm } from "./StepForm.js";
import type { IWorkflowStep } from "~/types.js";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";

export interface IStepProps {
    step: IWorkflowStep;
    onSave: (input: IWorkflowStep) => void;
    onRemove: (step: Pick<IWorkflowStep, "id">) => void;
    onMoveUp: (step: Pick<IWorkflowStep, "id">) => void;
    canMoveUp: (step: Pick<IWorkflowStep, "id">) => boolean;
    onMoveDown: (step: Pick<IWorkflowStep, "id">) => void;
    canMoveDown: (step: Pick<IWorkflowStep, "id">) => boolean;
}

export const Step = observer(
    ({
        step,
        onSave: initialOnSave,
        onRemove: initialOnRemove,
        onMoveUp,
        canMoveUp,
        onMoveDown,
        canMoveDown
    }: IStepProps) => {
        const [data, setData] = useState<IWorkflowStep | null>(null);
        const onEdit = useCallback(() => {
            setData(step);
        }, [data]);
        const onCancel = useCallback(() => {
            setData(null);
        }, [setData]);

        const onSave = useCallback(
            (input: IWorkflowStep) => {
                initialOnSave(input);
                onCancel();
            },
            [initialOnSave, onCancel]
        );

        const onRemove = useCallback(() => {
            onCancel();
            initialOnRemove(step);
        }, [step]);

        const moveUp = useCallback(() => {
            if (canMoveUp(step) === false) {
                return;
            }
            onMoveUp(step);
        }, [onMoveUp, step]);

        const moveDown = useCallback(() => {
            if (canMoveDown(step) === false) {
                return;
            }
            onMoveDown(step);
        }, [onMoveDown, step]);

        return (
            <Accordion.Item
                key={`step-${step.id}`}
                title={step.title}
                description={step.description}
                icon={<Color color={step.color} />}
                open={!!data}
                interactive={false}
                actions={
                    <>
                        <Accordion.Item.Action
                            onClick={moveUp}
                            disabled={!canMoveUp(step)}
                            icon={<ArrowUp />}
                        />
                        <Accordion.Item.Action
                            onClick={moveDown}
                            disabled={!canMoveDown(step)}
                            icon={<ArrowDown />}
                        />
                        <Accordion.Item.Action.Separator />
                        <Accordion.Item.Action onClick={onEdit} icon={<EditIcon />} />
                        <Accordion.Item.Action onClick={onRemove} icon={<TrashIcon />} />
                    </>
                }
            >
                <StepForm onCancel={onCancel} onSave={onSave} step={data} />
            </Accordion.Item>
        );
    }
);
