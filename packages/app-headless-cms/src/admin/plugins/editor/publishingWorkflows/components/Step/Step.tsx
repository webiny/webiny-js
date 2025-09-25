import React, { useCallback } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Color } from "./Color.js";
import { StepForm } from "./StepForm.js";
import type { IWorkflowStep } from "~/types.js";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";

export interface IStepProps {
    step: IWorkflowStep;
    onSave: (input: IWorkflowStep) => void;
    moveUp: ((input: Pick<IWorkflowStep, "id">) => void) | null;
    moveDown: ((input: Pick<IWorkflowStep, "id">) => void) | null;
}

export const Step = ({ step, onSave, moveUp: up, moveDown: down }: IStepProps) => {
    const moveUp = useCallback(() => {
        if (!up) {
            return;
        }
        up(step);
    }, [step, up]);
    const moveDown = useCallback(() => {
        if (!down) {
            return;
        }
        down(step);
    }, [step, down]);

    return (
        <Accordion.Item
            key={`step-${step.id}`}
            title={step.title}
            description={step.description}
            icon={<Color color={step.color} />}
            actions={
                <>
                    <Accordion.Item.Action onClick={moveUp} disabled={!up} icon={<ArrowUp />} />
                    <Accordion.Item.Action
                        onClick={moveDown}
                        disabled={!down}
                        icon={<ArrowDown />}
                    />
                    <Accordion.Item.Action.Separator />
                    <Accordion.Item.Action icon={<EditIcon />} />
                    <Accordion.Item.Action icon={<TrashIcon />} />
                </>
            }
        >
            <StepForm onSave={onSave} step={step} />;
        </Accordion.Item>
    );
};
