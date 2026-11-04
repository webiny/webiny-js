import React from "react";
import { Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { Select } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import type { ReviewListPresenter } from "../abstractions.js";
import { ReviewContentTypePicker } from "./ReviewContentTypePicker.js";

const ALL = "all";

interface ReviewStateFilterOption {
    label: string;
    value: string;
    state: ReviewStateValue | null;
}

interface StepStateFilterOption {
    label: string;
    value: string;
    state: StepStateValue | null;
}

const REVIEW_STATE_OPTIONS: ReviewStateFilterOption[] = [
    { label: "Any review state", value: ALL, state: null },
    { label: "In progress", value: ReviewState.InProgress, state: ReviewState.InProgress },
    { label: "Approved", value: ReviewState.Approved, state: ReviewState.Approved },
    { label: "Rejected", value: ReviewState.Rejected, state: ReviewState.Rejected }
];

const STEP_STATE_OPTIONS: StepStateFilterOption[] = [
    { label: "Any step state", value: ALL, state: null },
    { label: "Awaiting", value: StepState.Awaiting, state: StepState.Awaiting },
    { label: "In review", value: StepState.InReview, state: StepState.InReview },
    { label: "Failed", value: StepState.Failed, state: StepState.Failed }
];

export interface ReviewListToolbarProps {
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
}

export const ReviewListToolbar = createReactiveComponent((props: ReviewListToolbarProps) => {
    const { presenter, showContentType, contentTypeFilter } = props;
    const vm = presenter.vm;

    let contentTypeSelect: React.ReactNode = null;
    if (showContentType && contentTypeFilter) {
        contentTypeSelect = (
            <div data-role="toolbar-filter" className="w-2xs shrink-0">
                <ReviewContentTypePicker
                    options={contentTypeFilter.options}
                    value={vm.contentTypeId}
                    onChange={value => void presenter.setContentType(value)}
                />
            </div>
        );
    }

    let requestFilters: React.ReactNode = null;
    if (vm.tab === "myRequests") {
        const onReviewStateChange = (value: string) => {
            const option = REVIEW_STATE_OPTIONS.find(item => item.value === value);
            void presenter.setReviewState(option ? option.state : null);
        };
        const onStepStateChange = (value: string) => {
            const option = STEP_STATE_OPTIONS.find(item => item.value === value);
            void presenter.setStepState(option ? option.state : null);
        };
        requestFilters = (
            <>
                <div data-role="toolbar-filter" className="w-2xs shrink-0">
                    <Select
                        options={REVIEW_STATE_OPTIONS}
                        value={vm.reviewState ?? ALL}
                        onChange={onReviewStateChange}
                        placeholder="Any review state"
                        displayResetAction={vm.reviewState !== null}
                        size={"md"}
                    />
                </div>
                <div data-role="toolbar-filter" className="w-2xs shrink-0">
                    <Select
                        options={STEP_STATE_OPTIONS}
                        value={vm.stepState ?? ALL}
                        onChange={onStepStateChange}
                        placeholder="Any step state"
                        displayResetAction={vm.stepState !== null}
                        size={"md"}
                    />
                </div>
            </>
        );
    }

    return (
        <div data-role="review-list-toolbar" className="flex items-center gap-sm w-full">
            <div data-role="toolbar-search" className="flex-1 min-w-0">
                <Input
                    value={vm.searchDraft}
                    onChange={value => presenter.setSearchDraft(value)}
                    placeholder="Search by title"
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                />
            </div>
            {contentTypeSelect}
            {requestFilters}
        </div>
    );
});
