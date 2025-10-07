import React from "react";
import type { IWorkflowStep } from "~/types.js";

export const Title = ({ title }: Pick<IWorkflowStep, "title">) => {
    return <div>{title}</div>;
};
