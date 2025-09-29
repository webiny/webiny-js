import React, { useCallback, useMemo } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Color } from "./Color.js";
import { StepForm } from "./StepForm.js";
import type { IWorkflowStep } from "~/types.js";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { IWorkflowStepModel } from "../../models/abstractions/WorkflowStepModel.js";
import { observer } from "mobx-react-lite";

export interface IStepProps {
    step: IWorkflowStepModel;
    onSave: (input: IWorkflowStep) => void;
}

export const Step = observer(({ step, onSave }: IStepProps) => {
    const moveUp = useCallback(() => {
        if (!step.canMoveUp()) {
            return;
        }
        step.moveUp();
    }, [step]);
    const moveDown = useCallback(() => {
        if (!step.canMoveDown()) {
            return;
        }
        step.moveDown();
    }, [step]);

    const stepData = useMemo((): IWorkflowStep => {
        return {
            id: step.id,
            title: step.title,
            description: step.description,
            color: step.color,
            teams: step.teams,
            notifications: step.notifications
        };
    }, [step]);

    return (
        <Accordion.Item
            key={`step-${step.id}`}
            title={step.title}
            description={step.description}
            icon={<Color color={step.color} />}
            actions={
                <>
                    <Accordion.Item.Action
                        onClick={moveUp}
                        disabled={!step.canMoveUp()}
                        icon={<ArrowUp />}
                    />
                    <Accordion.Item.Action
                        onClick={moveDown}
                        disabled={!step.canMoveDown()}
                        icon={<ArrowDown />}
                    />
                    <Accordion.Item.Action.Separator />
                    <Accordion.Item.Action icon={<EditIcon />} />
                    <Accordion.Item.Action icon={<TrashIcon />} />
                </>
            }
        >
            <StepForm onSave={onSave} step={stepData} />
        </Accordion.Item>
    );
});
