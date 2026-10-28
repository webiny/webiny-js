import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import type { ModelPanelVm } from "~/editor/presentation/editor/abstractions.js";
import type { ModelRowVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { ModelPanel } from "./ModelPanel.js";
import type { ModelPanelProps } from "./ModelPanel.js";

const ARTICLE: ModelRowVm = {
    modelId: "article",
    name: "Article",
    subLine: "3 steps",
    bound: true,
    unsaved: true,
    active: true
};

const AUTHOR: ModelRowVm = {
    modelId: "author",
    name: "Author",
    subLine: "No workflow",
    bound: false,
    unsaved: false,
    active: false
};

const createPanel = (overrides: Partial<ModelPanelVm> = {}): ModelPanelVm => {
    return {
        label: "Content models",
        showSearch: true,
        search: "",
        rows: [ARTICLE, AUTHOR],
        loading: false,
        loadingMore: false,
        hasMore: false,
        emptyText: null,
        error: null,
        ...overrides
    };
};

const createProps = (overrides: Partial<ModelPanelProps> = {}): ModelPanelProps => {
    return {
        panel: createPanel(),
        renderIcon: modelId => <span data-testid={`icon-${modelId}`} />,
        onSearch: vi.fn(),
        onSelect: vi.fn(),
        onLoadMore: vi.fn(),
        onRetry: vi.fn(),
        ...overrides
    };
};

const rowOf = (name: string): HTMLElement => {
    return screen.getByText(name).closest("button") as HTMLElement;
};

describe("ModelPanel", () => {
    it("renders the label, the rows, their sub lines and the app's icons", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        expect(screen.getByText("Content models")).toBeTruthy();
        expect(within(rowOf("Article")).getByText("3 steps")).toBeTruthy();
        expect(within(rowOf("Author")).getByText("No workflow")).toBeTruthy();
        expect(within(rowOf("Article")).getByTestId("icon-article")).toBeTruthy();
        expect(within(rowOf("Author")).getByTestId("icon-author")).toBeTruthy();
    });

    it("marks the open row, the bound indicator and the unsaved dot", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        const article = rowOf("Article");
        expect(article.getAttribute("aria-current")).toBe("true");
        expect(within(article).getByText("Has a workflow")).toBeTruthy();
        expect(within(article).getByLabelText("Unsaved changes")).toBeTruthy();

        const author = rowOf("Author");
        expect(author.getAttribute("aria-current")).toBeNull();
        expect(within(author).queryByText("Has a workflow")).toBeNull();
        expect(within(author).queryByLabelText("Unsaved changes")).toBeNull();
    });

    it("selects a model on a row click", () => {
        const props = createProps();
        renderWithAdminUi(<ModelPanel {...props} />);

        fireEvent.click(rowOf("Author"));

        expect(props.onSelect).toHaveBeenCalledTimes(1);
        expect(props.onSelect).toHaveBeenCalledWith("author");
    });

    it("reports every change of the search input", () => {
        const props = createProps();
        renderWithAdminUi(<ModelPanel {...props} />);

        fireEvent.change(screen.getByPlaceholderText("Search models"), {
            target: { value: "art" }
        });

        expect(props.onSearch).toHaveBeenCalledWith("art");
    });

    it("shows the current search text", () => {
        renderWithAdminUi(
            <ModelPanel {...createProps({ panel: createPanel({ search: "auth" }) })} />
        );

        expect(screen.getByDisplayValue("auth")).toBeTruthy();
    });

    it("has no search input when the app shows none (Website Builder)", () => {
        renderWithAdminUi(
            <ModelPanel {...createProps({ panel: createPanel({ showSearch: false }) })} />
        );

        expect(screen.queryByPlaceholderText("Search models")).toBeNull();
    });

    it("shows Load more only while there are more models and calls it", () => {
        const { unmount } = renderWithAdminUi(<ModelPanel {...createProps()} />);
        expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
        unmount();

        const shown = createProps({ panel: createPanel({ hasMore: true }) });
        renderWithAdminUi(<ModelPanel {...shown} />);
        fireEvent.click(screen.getByRole("button", { name: "Load more" }));

        expect(shown.onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("disables Load more while the next page loads", () => {
        const panel = createPanel({ hasMore: true, loadingMore: true });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        const button = screen.getByRole("button", { name: "Load more" });
        expect(button.getAttribute("aria-disabled")).toBe("true");
    });

    it("shows the empty text instead of the rows", () => {
        const panel = createPanel({ rows: [], emptyText: "No models match “zzz”." });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        expect(screen.getByText("No models match “zzz”.")).toBeTruthy();
        expect(screen.queryByText("Article")).toBeNull();
    });

    it("styles the empty text as small muted centred text", () => {
        const panel = createPanel({ rows: [], emptyText: "No models match “zzz”." });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        const text = screen.getByText("No models match “zzz”.");
        expect(text.className).toContain("text-sm");
        expect(text.className).toContain("text-neutral-muted");
        expect(text.className).toContain("text-center");
    });

    it("draws the search icon at the start of the search input", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        const input = screen.getByPlaceholderText("Search models");
        expect(input.parentElement?.querySelector("svg")).not.toBeNull();
    });

    it("shows skeleton rows while loading", () => {
        const panel = createPanel({ rows: [], loading: true });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        expect(screen.getByTestId("model-panel-loading")).toBeTruthy();
        expect(screen.queryByText("Article")).toBeNull();
    });

    it("shows a failed search or page under the rows with Try again", () => {
        const props = createProps({ panel: createPanel({ error: "Could not load workflows" }) });
        renderWithAdminUi(<ModelPanel {...props} />);

        expect(screen.getByText("Could not load workflows")).toBeTruthy();
        expect(screen.getByText("Article")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(props.onRetry).toHaveBeenCalledTimes(1);
    });

    it("shows no error block while nothing failed", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    });
});
