import React from "react";
import { Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { createReactiveComponent } from "@webiny/app-admin";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import type { ReviewListPresenter } from "../abstractions.js";
import { ReviewContentTypeFilter } from "./ReviewContentTypeFilter.js";

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
            <div data-role="toolbar-filter" className="shrink-0">
                <ReviewContentTypeFilter
                    options={contentTypeFilter.options}
                    value={vm.contentTypeId}
                    onChange={value => void presenter.setContentType(value)}
                />
            </div>
        );
    }

    return (
        <div data-role="review-list-toolbar" className="flex items-center gap-sm w-full">
            <div data-role="toolbar-search" className="flex-1 min-w-0">
                <Input
                    value={vm.searchDraft}
                    onChange={value => presenter.setSearchDraft(value)}
                    placeholder="Search..."
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                />
            </div>
            {contentTypeSelect}
        </div>
    );
});
