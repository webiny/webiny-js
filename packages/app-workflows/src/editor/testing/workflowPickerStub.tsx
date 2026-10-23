import React from "react";
import type { WorkflowPickerProps } from "~/components/picker/WorkflowPicker.js";

// The text the stub's search button reports to `onSearch`.
export const WORKFLOW_PICKER_STUB_SEARCH = "camp";

/*
 * Replaces `WorkflowPicker` in the tests of its callers (`vi.mock("~/components/picker/WorkflowPicker.js", ...)`).
 * `data-testid` is `picker-{label}`; `data-option-details` is the options as JSON.
 */
export const WorkflowPickerStub = (props: WorkflowPickerProps) => {
    const optionIds = props.options.map(option => option.id).join(",");
    const details = JSON.stringify(props.options);
    const selected = props.selected;

    return (
        <div
            data-testid={`picker-${props.label}`}
            data-label={props.label}
            data-description={props.description ?? ""}
            data-required={String(props.required ?? false)}
            data-value={props.value ?? ""}
            data-selected={selected === null ? "" : selected.label}
            data-selected-id={selected === null ? "" : selected.id}
            data-selected-icon={selected === null ? "" : (selected.icon ?? "")}
            data-selected-muted={String(selected === null ? false : selected.muted)}
            data-selected-disabled={String(selected === null ? false : selected.disabled)}
            data-options={optionIds}
            data-option-details={details}
            data-placeholder={props.placeholder}
            data-any-label={props.anyLabel ?? ""}
            data-disabled={String(props.disabled)}
            data-error={props.error ?? ""}
        >
            {props.options.map(option => (
                <button
                    key={option.id}
                    type={"button"}
                    aria-label={`${props.label}: choose ${option.label}`}
                    onClick={() => props.onChange(option.id)}
                >
                    {option.label}
                </button>
            ))}
            <button
                type={"button"}
                aria-label={`${props.label}: clear`}
                onClick={() => props.onChange(null)}
            >
                clear
            </button>
            <button
                type={"button"}
                aria-label={`${props.label}: search`}
                onClick={() => props.onSearch(WORKFLOW_PICKER_STUB_SEARCH)}
            >
                search
            </button>
        </div>
    );
};
