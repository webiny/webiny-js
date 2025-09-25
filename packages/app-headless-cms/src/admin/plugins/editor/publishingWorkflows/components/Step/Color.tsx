import React from "react";
import type { IWorkflowStep } from "~/types.js";

export const Color = ({ color }: Pick<IWorkflowStep, "color">) => {
    return (
        <div
            style={{
                display: "flex",
                width: 5,
                height: "40px",
                borderRadius: "5px",
                backgroundColor: color,
                margin: 0
            }}
        />
    );
};
