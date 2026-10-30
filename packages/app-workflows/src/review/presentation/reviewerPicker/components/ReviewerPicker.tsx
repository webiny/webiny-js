import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { AutoComplete } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import type { ReviewerPickerPresenter } from "../abstractions.js";
import { renderReviewerOption } from "./renderReviewerOption.js";

export interface ReviewerPickerProps {
    presenter: ReviewerPickerPresenter.Interface;
    // The accessible name only; the dialogs show no visible label (design).
    label?: string;
    hint?: string;
}

// The reviewer picker over `AutoComplete` (R209): client-side search, disabled people, retry in the list.
export const ReviewerPicker = createReactiveComponent(function ReviewerPicker(
    props: ReviewerPickerProps
) {
    const { presenter, label, hint } = props;
    const { vm } = presenter;

    let emptyMessage: React.ReactNode = vm.emptyMessage;
    if (vm.error !== null) {
        emptyMessage = (
            <div className={"flex flex-col items-center gap-xs"}>
                <Text size={"sm"}>{vm.error}</Text>
                <Button
                    variant={"tertiary"}
                    size={"sm"}
                    text={"Try again"}
                    onClick={() => presenter.retry()}
                />
            </div>
        );
    }

    // `item` hands the option to the row renderer.
    const options = vm.options.map(option => {
        return {
            label: option.label,
            value: option.value,
            disabled: option.disabled,
            item: option
        };
    });

    return (
        <div role={"group"} aria-label={label}>
            <AutoComplete
                note={hint}
                placeholder={"Search reviewers by name"}
                startIcon={<Icon icon={<SearchIcon />} label={""} size={"sm"} />}
                displayResetAction={vm.value !== null}
                options={options}
                value={vm.value ?? undefined}
                loading={vm.loading}
                loadingMessage={"Searching…"}
                emptyMessage={emptyMessage}
                initialMessage={emptyMessage}
                optionRenderer={renderReviewerOption}
                onValueSearch={query => presenter.search(query)}
                onValueChange={id => presenter.select(id)}
            />
        </div>
    );
});
