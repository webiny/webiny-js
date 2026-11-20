import React from "react";
import { useId } from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListState } from "../parseReviewListState.js";
import { ReviewListStateLabel } from "./ReviewListStateLabel.js";

export interface ReviewListStateControlProps {
    presenter: ReviewListPresenter.Interface;
}

// Where the listed reviews are (`vm.states`); a state empty by definition for the scope is disabled
// and says why in a tooltip (B8).
export const ReviewListStateControl = createReactiveComponent(
    ({ presenter }: ReviewListStateControlProps) => {
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
            void presenter.setState(state);
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
