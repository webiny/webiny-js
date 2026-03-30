import type { ButtonActionDefinition } from "../types";

export const previousStepButtonAction: ButtonActionDefinition = {
    type: "previousStep",
    name: "Previous Step",
    updateButtonLabel: "Previous step",
    description:
        "Moves to the previous step in the funnel. Cannot be added together with the next step action.",
    canAdd: ({ actions }) => {
        return (
            !actions.some(a => a.type === "nextStep") &&
            !actions.some(a => a.type === "previousStep")
        );
    }
};
