import React from "react";
import { useId } from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListState } from "../parseReviewListState.js";
import { ReviewListStateLabel } from "./ReviewListStateLabel.js";

export interface ReviewListStateControlProps {
    presenter: ReviewListPresenter.Interface;
    // Called once the presenter took the choice; the page writes it to the URL.
    onChanged?: () => void;
}

// Where the listed reviews are (`vm.states`); a state empty by definition for the scope is disabled
// and says why in a tooltip (B8).
export const ReviewListStateControl = createReactiveComponent(
    ({ presenter, onChanged }: ReviewListStateControlProps) => {
        const labelId = useId();
        const vm = presenter.vm;
        const items = vm.states.map(state => {
            return {
                label: <ReviewListStateLabel state={state} />,
                value: state.value,
                disabled: state.disabled
            };
        });

        const onChange = (value: string) => {
            const state = parseReviewListState(value);
            if (!state) {
                return;
            }
            const pending = presenter.setState(state);
            onChanged?.();
            void pending;
        };

        return (
            <div data-role="review-list-state">
                <span id={labelId} className={"sr-only"}>
                    Review state
                </span>
                <SegmentedControl
                    items={items}
                    value={vm.state}
                    onChange={onChange}
                    aria-labelledby={labelId}
                    variant={"dimmed"}
                />
            </div>
        );
    }
);
