import React from "react";
import { IWorkflowStep } from "~/types.js";
import { Accordion, IconButton } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

export type IInactiveStep = Required<Omit<IWorkflowStep, "teams" | "notifications">>;

export interface IInactiveStepProps {
    step: IInactiveStep;
}

export const InactiveStep = (props: IInactiveStepProps) => {
    const { step } = props;

    return (
        <div className={"flex items-center justify-space-between gap-sm-plus"}>
            <Accordion variant={"container"} background={"light"}>
                <Accordion.Item
                    locked={true}
                    key={`step-${step.id}`}
                    title={step.title}
                    subtitle={step.description}
                    colorMark={step.color}>
                    <></>
                </Accordion.Item>
            </Accordion>
            {step.id === "draft" ? (
                <IconButton icon={<AddIcon />} variant={"ghost"} size={"sm"} iconSize={"lg"} />
            ) : (
                <div className={"size-lg"} />
            )}
        </div>
    );
};
