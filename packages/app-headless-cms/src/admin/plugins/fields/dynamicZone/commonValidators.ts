import { CmsModelFieldValidatorConfig } from "~/types";

export const commonValidators: CmsModelFieldValidatorConfig[] = [
    {
        name: "minLength",
        label: "Minimum number of entries",
        description: "Define the minimum number of entries a user must create.",
        defaultMessage: "You must create at least {value} entries.",
        variables: [
            {
                name: "value",
                description: "This defines the minimum number of entries a user must create."
            }
        ]
    },
    {
        name: "maxLength",
        label: "Maximum number of entries",
        description: "Define the maximum number of entries a user can create.",
        defaultMessage: "You have too many entries (max: {value}).",
        variables: [
            {
                name: "value",
                description: "This defines the maximum number of entries a user can create."
            }
        ]
    }
];
