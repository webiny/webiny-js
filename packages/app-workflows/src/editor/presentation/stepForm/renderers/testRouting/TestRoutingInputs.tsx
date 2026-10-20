import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { STEP_FORM_MESSAGES } from "../../stepFormMessages.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingPickerProps {
    value: string | null;
    // The chosen option with its label, so the field keeps it when a search narrows the list.
    selected: PickerOption | null;
    options: PickerOption[];
    // The list failed to load: the picker is replaced by the options banner.
    failed: boolean;
    retry(): void;
    onSearch(query: string): void;
    onChange(id: string | null): void;
}

export interface TestRoutingInputsProps {
    requester: TestRoutingPickerProps;
    folder: TestRoutingPickerProps;
    // A test is running: both inputs are disabled (R300).
    disabled: boolean;
}

interface PickerFailureProps {
    label: string;
    retry(): void;
}

const PickerFailure = ({ label, retry }: PickerFailureProps) => {
    return (
        <div className={"w-full"}>
            <FormComponentLabel text={label} />
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={<Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={retry} />}
            >
                {STEP_FORM_MESSAGES.optionsFailed}
            </Alert>
        </div>
    );
};

// The Requester and Folder pickers of the Test routing tab (R315). Plain props, no state.
export const TestRoutingInputs = (props: TestRoutingInputsProps) => {
    const { requester, folder, disabled } = props;

    let requesterField: React.ReactNode = (
        <WorkflowPicker
            label={TEST_ROUTING_TAB_MESSAGES.requesterLabel}
            placeholder={TEST_ROUTING_TAB_MESSAGES.requesterPlaceholder}
            anyLabel={null}
            value={requester.value}
            selected={requester.selected}
            options={requester.options}
            onSearch={requester.onSearch}
            onChange={requester.onChange}
            disabled={disabled}
            error={null}
        />
    );
    if (requester.failed) {
        requesterField = (
            <PickerFailure
                label={TEST_ROUTING_TAB_MESSAGES.requesterLabel}
                retry={requester.retry}
            />
        );
    }

    let folderField: React.ReactNode = (
        <WorkflowPicker
            label={TEST_ROUTING_TAB_MESSAGES.folderLabel}
            placeholder={TEST_ROUTING_TAB_MESSAGES.folderPlaceholder}
            anyLabel={TEST_ROUTING_TAB_MESSAGES.rootFolder}
            value={folder.value}
            selected={folder.selected}
            options={folder.options}
            onSearch={folder.onSearch}
            onChange={folder.onChange}
            disabled={disabled}
            error={null}
        />
    );
    if (folder.failed) {
        folderField = (
            <PickerFailure label={TEST_ROUTING_TAB_MESSAGES.folderLabel} retry={folder.retry} />
        );
    }

    return (
        <div className={"grid grid-cols-2 gap-md"}>
            {requesterField}
            {folderField}
        </div>
    );
};
