import React from "react";
import { IWorkflowStep } from "~/types.js";
import { Accordion } from "@webiny/admin-ui";

export type IInactiveStep = Required<Omit<IWorkflowStep, "teams" | "notifications">>;

export interface IInactiveStepProps {
    step: IInactiveStep;
}

export const InactiveStep = (props: IInactiveStepProps) => {
    const { step } = props;

    return (
        <Accordion variant={"container"} background={"light"}>
            <Accordion.Item
                locked={true}
                key={`step-${step.id}`}
                title={step.title}
                subtitle={step.description}
                colorMark={step.color}
            >
                <></>
            </Accordion.Item>
        </Accordion>
    );
};
