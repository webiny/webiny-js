import type { ButtonActionDefinition } from "../types";

export const saveUserToCrmButtonAction: ButtonActionDefinition = {
    type: "saveUserToCrm",
    name: "Save User to CRM",
    description:
        "Verifies the user's email and saves their data to the CRM. Requires a field with field ID 'email' to be present in the form.",
    canAdd: ({ actions }) => {
        return !actions.some(a => a.type === "saveUserToCrm");
    }
};
