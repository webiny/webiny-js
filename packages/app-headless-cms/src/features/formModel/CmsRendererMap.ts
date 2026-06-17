const CMS_TO_FORM_RENDERER: Record<string, string> = {
    "text-input": "textInput",
    "text-inputs": "textInputs",
    tags: "tags",
    "long-text-text-area": "textarea",
    "long-text-inputs": "textareas",
    "number-input": "numberInput",
    "number-inputs": "numberInputs",
    "boolean-input": "switch",
    "date-time-input": "dateTimePicker",
    "date-time-inputs": "dateTimeInputs",
    "select-box": "dropdown",
    "radio-buttons": "radioButtons",
    checkboxes: "checkboxes",
    hidden: "hidden",
    passthrough: "passthrough",
    "lexical-text-input": "lexical",
    "lexical-text-inputs": "lexical",
    "object-accordion": "objectAccordion",
    "objects-accordion": "objectAccordion",
    "object-accordion-multiple": "objectAccordion",
    dynamicZone: "dynamicZone",
    "ref-input": "refInput",
    "ref-inputs": "refInputs",
    "ref-simple-single": "refSimpleSingle",
    "ref-simple-multiple": "refSimpleMultiple",
    "ref-advanced-single": "refDetailedSingle",
    "ref-advanced-multiple": "refDetailedMultiple"
};

export function mapCmsRendererName(cmsRendererName: string): string | undefined {
    return CMS_TO_FORM_RENDERER[cmsRendererName];
}
