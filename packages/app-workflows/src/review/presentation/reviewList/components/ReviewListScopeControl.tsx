import React from "react";
import { useId } from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListScope } from "../parseReviewListScope.js";

export interface ReviewListScopeControlProps {
    presenter: ReviewListPresenter.Interface;
}

// Whose reviews the list shows (`vm.scopes`): All only with `reassign` or full access (R259).
export const ReviewListScopeControl = createReactiveComponent(
    ({ presenter }: ReviewListScopeControlProps) => {
        const labelId = useId();
        const vm = presenter.vm;
        const items = vm.scopes.map(scope => {
            return { label: scope.label, value: scope.value };
        });

        const onChange = (value: string) => {
            const scope = parseReviewListScope(value);
            if (!scope) {
                return;
            }
            void presenter.setScope(scope);
        };

        return (
            <div data-role="review-list-scope">
                <span id={labelId} className={"sr-only"}>
                    Whose reviews
                </span>
                <SegmentedControl
                    items={items}
                    value={vm.scope}
                    onChange={onChange}
                    aria-labelledby={labelId}
                />
            </div>
        );
    }
);
