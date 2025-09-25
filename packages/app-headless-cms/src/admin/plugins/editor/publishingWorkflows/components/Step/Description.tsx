import React from "react";
import type { IWorkflowStep } from "~/types.js";

export const Description = ({ description }: Pick<IWorkflowStep, "description">) => {
    if (!description) {
        return null;
    }
    return <div>({description})</div>;
};
