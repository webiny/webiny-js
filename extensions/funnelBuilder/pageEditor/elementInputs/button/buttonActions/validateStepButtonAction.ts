import type { ButtonActionDefinition } from "../types";

export const validateStepButtonAction: ButtonActionDefinition = {
    type: "validateStep",
    name: "Validate fields on current page",
    description:
        "Validates all fields on the current page. If valid, moves to the next action in the chain.",
    canAdd: ({ actions }) => {
        return !actions.some(a => a.type === "validateStep");
    }
};
