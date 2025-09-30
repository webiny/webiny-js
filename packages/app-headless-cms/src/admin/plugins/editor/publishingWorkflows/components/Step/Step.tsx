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
import type { IWorkflowStepModel } from "../../models/index.js";

export interface IStepProps {
    step: IWorkflowStepModel;
    onSave: (input: IWorkflowStep) => void;
    onRemove: (step: Pick<IWorkflowStep, "id">) => void;
}

export const Step = observer(
    ({ step, onSave: initialOnSave, onRemove: initialOnRemove }: IStepProps) => {
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
                            onClick={() => step.moveUp()}
                            disabled={!step.canMoveUp()}
                            icon={<ArrowUp />}
                        />
                        <Accordion.Item.Action
                            onClick={() => step.moveDown()}
                            disabled={!step.canMoveDown()}
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
