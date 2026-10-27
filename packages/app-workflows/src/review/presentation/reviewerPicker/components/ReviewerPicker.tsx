import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { AutoComplete } from "@webiny/admin-ui";
import type { ReviewerPickerPresenter } from "../abstractions.js";

export interface ReviewerPickerProps {
    presenter: ReviewerPickerPresenter.Interface;
    label: string;
    hint?: string;
}

// The reviewer picker over `AutoComplete` (R209): client-side search, disabled people, retry.
export const ReviewerPicker = createReactiveComponent(function ReviewerPicker(
    props: ReviewerPickerProps
) {
    const { presenter, label, hint } = props;
    const { vm } = presenter;

    if (vm.error !== null) {
        return (
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={<Alert.Action text={"Retry"} onClick={() => presenter.retry()} />}
            >
                {vm.error}
            </Alert>
        );
    }

    return (
        <AutoComplete
            label={label}
            description={hint}
            placeholder={"Search reviewers by name"}
            options={vm.options}
            value={vm.value ?? undefined}
            loading={vm.loading}
            loadingMessage={"Searching…"}
            emptyMessage={vm.emptyMessage}
            onValueSearch={query => presenter.search(query)}
            onValueChange={id => presenter.select(id)}
        />
    );
});
