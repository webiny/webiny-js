import type { ButtonActionDefinition } from "../types";

export const nextStepButtonAction: ButtonActionDefinition = {
    type: "nextStep",
    name: "Next Step",
    updateButtonLabel: "Next step",
    description:
        "Moves to the next step in the funnel. Cannot be added together with the previous step action.",
    canAdd: ({ actions }) => {
        return (
            !actions.some(a => a.type === "nextStep") &&
            !actions.some(a => a.type === "previousStep")
        );
    }
};
