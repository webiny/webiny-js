export const conditionChainOptions = [
    { label: "AND", value: "matchAll" },
    { label: "OR", value: "matchAny" }
];

export const fieldConditionOptions = [
    {
        type: "text",
        options: [
            { label: "Equals", value: "is" },
            { label: "Not Equals", value: "not_is" },
            { label: "Starts With", value: "starts" },
            { label: "Does Not Starts With", value: "not_starts" },
            { label: "Ends With", value: "ends" },
            { label: "Does Not Ends With", value: "not_ends" },
            { label: "Contains", value: "contains" },
            { label: "Not Contains", value: "not_contains" }
        ]
    },
    {
        type: "textarea",
        options: [
            { label: "Equals", value: "is" },
            { label: "Not Equals", value: "not_is" },
            { label: "Starts With", value: "starts" },
            { label: "Does Not Starts With", value: "not_starts" },
            { label: "Ends With", value: "ends" },
            { label: "Does Not Ends With", value: "not_ends" },
            { label: "Contains", value: "contains" },
            { label: "Not Contains", value: "not_contains" }
        ]
    },
    {
        type: "radio",
        options: [
            { label: "Is", value: "is" },
            { label: "Is Not", value: "not_is" }
        ]
    },
    {
        type: "number",
        options: [
            { label: "Is", value: "is" },
            { label: "Is Smaller", value: "lt" },
            { label: "Is Smaller Or Equal", value: "lte" },
            { label: "Is Larger", value: "gt" },
            { label: "Is Larger Or Equal", value: "gte" }
        ]
    },
    {
        type: "hidden",
        options: [
            { label: "Equals", value: "is" },
            { label: "Not Equals", value: "not_is" },
            { label: "Starts With", value: "starts" },
            { label: "Does Not Starts With", value: "not_starts" },
            { label: "Ends With", value: "ends" },
            { label: "Does Not Ends With", value: "not_ends" },
            { label: "Contains", value: "contains" },
            { label: "Not Contains", value: "not_contains" }
        ]
    },
    {
        type: "datetime",
        options: [
            { label: "In", value: "in" },
            { label: "Not", value: "not" },
            { label: "Not In", value: "not_in" },
            { label: "Lower", value: "time_lt" },
            { label: "Lower or equal", value: "time_lte" },
            { label: "Greater", value: "time_gt" },
            { label: "Greater or equal", value: "time_gte" }
        ]
    },
    {
        type: "checkbox",
        options: [
            { label: "Is Selected", value: "is" },
            { label: "Is Not Selected", value: "not_is" }
        ]
    },
    {
        type: "select",
        options: [
            { label: "Is", value: "is" },
            { label: "Is Not", value: "not_is" }
        ]
    }
];

export const ruleActionOptions = [
    {
        value: "goToStep",
        label: "Go to step"
    },
    {
        value: "submit",
        label: "Submit"
    },
    {
        value: "submitAndRedirect",
        label: "Submit & Redirect"
    }
];
