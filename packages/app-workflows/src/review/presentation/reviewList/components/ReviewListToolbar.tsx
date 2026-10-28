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
            <div className="grow">
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
                <div className="grow">
                    <Select
                        options={REVIEW_STATE_OPTIONS}
                        value={vm.reviewState ?? ALL}
                        onChange={onReviewStateChange}
                        placeholder="Any review state"
                        displayResetAction={vm.reviewState !== null}
                    />
                </div>
                <div className="grow">
                    <Select
                        options={STEP_STATE_OPTIONS}
                        value={vm.stepState ?? ALL}
                        onChange={onStepStateChange}
                        placeholder="Any step state"
                        displayResetAction={vm.stepState !== null}
                    />
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-sm mb-md">
            <div className="grow">
                <Input
                    value={vm.searchDraft}
                    onChange={value => presenter.setSearchDraft(value)}
                    placeholder="Search by title"
                    startIcon={<Icon icon={<SearchIcon />} label={""} size={"sm"} />}
                />
            </div>
            {contentTypeSelect}
            {requestFilters}
        </div>
    );
});
