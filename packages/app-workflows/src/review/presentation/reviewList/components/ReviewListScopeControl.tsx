import React from "react";
import { useId } from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListScope } from "../parseReviewListScope.js";

export interface ReviewListScopeControlProps {
    presenter: ReviewListPresenter.Interface;
    // Called once the presenter took the choice; the page writes it to the URL.
    onChanged?: () => void;
}

// Whose reviews the list shows (`vm.scopes`): every scope is open to every viewer (designer answer B7).
export const ReviewListScopeControl = createReactiveComponent(
    ({ presenter, onChanged }: ReviewListScopeControlProps) => {
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
            const pending = presenter.setScope(scope);
            onChanged?.();
            void pending;
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
                    variant={"dimmed"}
                />
            </div>
        );
    }
);
