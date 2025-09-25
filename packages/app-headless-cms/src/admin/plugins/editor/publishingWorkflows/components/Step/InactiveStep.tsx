import React from "react";
import { IWorkflowStep } from "~/types";
import { Accordion } from "@webiny/admin-ui";
import { Color } from "~/admin/plugins/editor/publishingWorkflows/components/Step/Color.js";
import { LockedIndicator } from "~/admin/plugins/editor/publishingWorkflows/components/Step/LockedIndicator.js";

export type IInactiveStep = Required<Omit<IWorkflowStep, "teams" | "notifications">>;

export interface IInactiveStepProps {
    step: IInactiveStep;
}

export const InactiveStep = (props: IInactiveStepProps) => {
    const { step } = props;

    return (
        <Accordion.Item
            disabled={true}
            key={`step-${step.id}`}
            title={step.title}
            description={step.description}
            icon={<Color color={step.color} />}
            interactive={false}
            actions={
                <>
                    <Accordion.Item.Action icon={<LockedIndicator content={step.description} />} />
                </>
            }
        >
            <></>
        </Accordion.Item>
    );
};
