import type { IWorkflowStateStep } from "~/types.js";
import { Tag } from "@webiny/admin-ui";
import React from "react";

interface ITagStepProps {
    step: IWorkflowStateStep;
}

export const TagStep = (props: ITagStepProps) => {
    const { step } = props;
    return <Tag swatchColor={step.color} variant={"neutral-light"} content={step.title} />;
};
