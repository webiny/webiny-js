import React from "react";
import type { IWorkflowStep } from "~/types.js";
import type { IWorkflowStepInput } from "../types.js";

export interface IStepFormProps {
    step: IWorkflowStepInput | null;
    onSave: (input: IWorkflowStep) => void;
}

export const StepForm = ({ step, onSave }: IStepFormProps) => {
    return <>Form</>;
};
