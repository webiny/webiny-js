import React from "react";
import { useId } from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListState } from "../parseReviewListState.js";

export interface ReviewListStateControlProps {
    presenter: ReviewListPresenter.Interface;
}

// Where the listed reviews are (`vm.states`); a state empty by definition for the scope is disabled.
export const ReviewListStateControl = createReactiveComponent(
    ({ presenter }: ReviewListStateControlProps) => {
        const labelId = useId();
        const vm = presenter.vm;
        const items = vm.states.map(state => {
            return { label: state.label, value: state.value, disabled: state.disabled };
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
                />
            </div>
        );
    }
);
