import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { renderWithAdminUi as render } from "~/review/testing/renderWithAdminUi.js";
import { screen } from "@testing-library/react";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewListPresenter } from "../abstractions.js";
import { REVIEW_LIST_TABS } from "../reviewListTabs.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";

const createVm = (
    overrides: Partial<ReviewListPresenter.ViewModel> = {}
): ReviewListPresenter.ViewModel => {
    return {
        tab: "assignedToMe",
        tabs: REVIEW_LIST_TABS,
        rows: [],
        status: "ready",
        loadingMore: false,
        hasMore: false,
        sort: "lastChangedOn_ASC",
        search: "",
        searchDraft: "",
        contentTypeId: null,
        reviewState: null,
        stepState: null,
        notice: null,
        error: null,
        empty: null,
        isFiltered: false,
        dialog: null,
        ...overrides
    };
};

const createPresenter = (vm: ReviewListPresenter.ViewModel): ReviewListPresenter.Interface => {
    return {
        vm,
        init: vi.fn(),
        setTab: vi.fn(),
        setSearchDraft: vi.fn(),
        setSearch: vi.fn(),
        setContentType: vi.fn(),
        setReviewState: vi.fn(),
        setStepState: vi.fn(),
        toggleSort: vi.fn(),
        loadMore: vi.fn(),
        refresh: vi.fn(),
        showNewReviews: vi.fn(),
        clearFilters: vi.fn(),
        removeLeavingRow: vi.fn(),
        openRowAction: vi.fn(),
        openDetails: vi.fn(),
        closeDialog: vi.fn(),
        actionDone: vi.fn(),
        dispose: vi.fn()
    };
};

describe("ReviewListToolbar", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("sends every keystroke to the presenter's draft and applies nothing itself", () => {
        const presenter = createPresenter(createVm());
        render(
            <ReviewListToolbar
                presenter={presenter}
                showContentType={false}
                contentTypeFilter={null}
            />
        );
        const input = screen.getByPlaceholderText("Search by title");

        fireEvent.change(input, { target: { value: "bud" } });
        fireEvent.change(input, { target: { value: "budget" } });
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(presenter.setSearchDraft).toHaveBeenCalledTimes(2);
        expect(presenter.setSearchDraft).toHaveBeenLastCalledWith("budget");
        expect(presenter.setSearch).not.toHaveBeenCalled();
    });

    it("shows the draft of the view model", () => {
        const presenter = createPresenter(createVm({ search: "applied", searchDraft: "typing" }));
        render(
            <ReviewListToolbar
                presenter={presenter}
                showContentType={false}
                contentTypeFilter={null}
            />
        );

        const input = screen.getByPlaceholderText("Search by title") as HTMLInputElement;

        expect(input.value).toBe("typing");
    });

    it("offers the content type filter only with the option and a filter", () => {
        const filter = { options: [{ label: "Article", value: "article" }] };

        const hidden = render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={false}
                contentTypeFilter={filter}
            />
        );
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
        hidden.unmount();

        const noFilter = render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={true}
                contentTypeFilter={null}
            />
        );
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
        noFilter.unmount();

        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });

    it("adds the review state and step state selects on My requests only", () => {
        const filter = { options: [{ label: "Article", value: "article" }] };

        const other = render(
            <ReviewListToolbar
                presenter={createPresenter(createVm({ tab: "pool" }))}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
        other.unmount();

        render(
            <ReviewListToolbar
                presenter={createPresenter(
                    createVm({ tab: "myRequests", reviewState: ReviewState.Approved })
                )}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        expect(screen.getAllByRole("combobox")).toHaveLength(3);
    });

    it("shows the search and the content type filter only on Failed steps (QBZ-29)", () => {
        const filter = { options: [{ label: "Article", value: "article" }] };

        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm({ tab: "failedSteps" }))}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );

        expect(screen.getByPlaceholderText("Search by title")).toBeTruthy();
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });
});
