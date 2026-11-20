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
import type { ReviewListPresenter } from "../abstractions.js";
import { getReviewListStates } from "../getReviewListStates.js";
import { REVIEW_LIST_SCOPES } from "../reviewListScopes.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";

const createVm = (
    overrides: Partial<ReviewListPresenter.ViewModel> = {}
): ReviewListPresenter.ViewModel => {
    return {
        scope: "assignedToMe",
        scopes: REVIEW_LIST_SCOPES,
        state: "inReview",
        states: getReviewListStates("assignedToMe"),
        rows: [],
        status: "ready",
        loadingMore: false,
        hasMore: false,
        sort: "lastChangedOn_ASC",
        search: "",
        searchDraft: "",
        contentTypeId: null,
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
        setScope: vi.fn(),
        setState: vi.fn(),
        setSearchDraft: vi.fn(),
        setSearch: vi.fn(),
        setContentType: vi.fn(),
        toggleSort: vi.fn(),
        loadMore: vi.fn(),
        refresh: vi.fn(),
        showNewReviews: vi.fn(),
        clearFilters: vi.fn(),
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
        const filter: IReviewContentTypeFilter = {
            options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
        };

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

    it("has no review state or step state select on any scope (B2 design 1)", () => {
        const filter: IReviewContentTypeFilter = {
            options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
        };

        for (const scope of ["pool", "myRequests", "all"] as const) {
            const view = render(
                <ReviewListToolbar
                    presenter={createPresenter(createVm({ scope, state: "all" }))}
                    showContentType={true}
                    contentTypeFilter={filter}
                />
            );
            expect(screen.getAllByRole("combobox")).toHaveLength(1);
            expect(screen.queryByText("Any review state")).toBeNull();
            expect(screen.queryByText("Any step state")).toBeNull();
            view.unmount();
        }
    });

    it("lays the search and the content type filter out as cells of one toolbar row", () => {
        const filter: IReviewContentTypeFilter = {
            options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
        };

        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm({ scope: "myRequests" }))}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );

        const row = document.querySelector('[data-role="review-list-toolbar"]') as HTMLElement;
        const cells = Array.from(row.children).map(cell => cell.getAttribute("data-role"));
        expect(cells).toEqual(["toolbar-search", "toolbar-filter"]);
        expect(screen.getByPlaceholderText("Search by title")).toBeTruthy();
    });

    it("renders the content type filter as a picker with the filter icon and no clear button", () => {
        const filter: IReviewContentTypeFilter = {
            options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
        };

        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );

        expect(document.querySelector('[data-picker-field-icon="filter_list"]')).not.toBeNull();
        expect(screen.getByPlaceholderText("All content types")).toBeTruthy();
        expect(screen.queryByLabelText("Clear")).toBeNull();
    });

    it("lists the content types with their app and icon and filters them by search", () => {
        const filter: IReviewContentTypeFilter = {
            options: [
                { label: "Article", value: "article", app: "cms", icon: "devices_other" },
                { label: "Press release", value: "press", app: "cms", icon: "devices_other" }
            ]
        };
        const presenter = createPresenter(createVm());
        render(
            <ReviewListToolbar
                presenter={presenter}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        const input = screen.getByPlaceholderText("All content types");

        fireEvent.focus(input);
        fireEvent.click(input);
        fireEvent.change(input, { target: { value: "press" } });

        expect(screen.queryByText("Article")).toBeNull();
        expect(screen.getByText("Press release")).toBeTruthy();
        expect(screen.getByText("Headless CMS")).toBeTruthy();
        expect(document.querySelector('[data-picker-icon="devices_other"]')).not.toBeNull();

        fireEvent.click(screen.getByText("Press release"));

        expect(presenter.setContentType).toHaveBeenCalledWith("press");
    });

    it("gives the search input a search icon", () => {
        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm({ scope: "myRequests" }))}
                showContentType={false}
                contentTypeFilter={null}
            />
        );

        expect(
            screen.getByPlaceholderText("Search by title").parentElement?.querySelector("svg")
        ).not.toBeNull();
    });
});
