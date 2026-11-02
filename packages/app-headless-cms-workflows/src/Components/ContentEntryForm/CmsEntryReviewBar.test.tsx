import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import type { Route } from "@webiny/app-admin";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { CmsEntryReviewBar } from "./CmsEntryReviewBar.js";
import { MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";

interface FakeBarProps {
    reviewsRoute: Route<any>;
    fieldLabels?: Record<string, string>;
    contentTypeLabel?: string;
}

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");

    return {
        EditorReviewBar: (props: FakeBarProps) => {
            return React.createElement("div", {
                "data-testid": "editor-review-bar",
                "data-reviews-path": props.reviewsRoute.path,
                "data-field-labels": JSON.stringify(props.fieldLabels ?? null),
                "data-content-type-label": props.contentTypeLabel
            });
        }
    };
});

function renderContent(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({
        ...params,
        children: (
            <>
                <CmsEntryReviewBar />
                <ContentEntryFormContent>
                    <div data-testid="original" />
                </ContentEntryFormContent>
            </>
        )
    });
}

describe("CmsEntryReviewBar", () => {
    it("renders one bar above the original content of a loaded entry", async () => {
        renderContent({ reviewVm: BOUND_NO_REVIEW });

        const bars = await screen.findAllByTestId("editor-review-bar");
        const original = screen.getByTestId("original");

        expect(bars).toHaveLength(1);
        expect(bars[0].getAttribute("data-reviews-path")).toBe("/cms/content-reviews");
        const position = bars[0].compareDocumentPosition(original);
        expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("passes the model name to the bar as the content type label", async () => {
        renderContent({ reviewVm: BOUND_NO_REVIEW });

        const [bar] = await screen.findAllByTestId("editor-review-bar");
        expect(bar.getAttribute("data-content-type-label")).toBe("Article");
    });

    it("passes the model's field labels to the bar for Review details (RD5)", async () => {
        const model = {
            ...MODEL,
            fields: [
                { fieldId: "title", label: "Title" },
                { fieldId: "description", label: "Body" }
            ]
        } as unknown as typeof MODEL;
        renderContent({ formVm: { model }, reviewVm: BOUND_NO_REVIEW });

        const [bar] = await screen.findAllByTestId("editor-review-bar");
        expect(JSON.parse(bar.getAttribute("data-field-labels") ?? "null")).toEqual({
            title: "Title",
            description: "Body"
        });
    });

    it.each([
        ["loading", LOADING],
        ["in review", IN_REVIEW]
    ])("shows the bar while the status is %s", async (_name, reviewVm) => {
        renderContent({ reviewVm });

        expect(await screen.findAllByTestId("editor-review-bar")).toHaveLength(1);
    });

    it("shows nothing when no workflow is bound", async () => {
        renderContent({ reviewVm: NO_WORKFLOW });

        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());
        expect(screen.getByTestId("original")).toBeTruthy();
    });

    it("shows nothing for a new entry", async () => {
        renderContent({ formVm: { entry: null, isNewEntry: true }, reviewVm: BOUND_NO_REVIEW });

        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());
        expect(screen.getByTestId("original")).toBeTruthy();
    });

    it("shows nothing for a singleton model", async () => {
        renderContent({ formVm: { model: SINGLETON_MODEL }, reviewVm: BOUND_NO_REVIEW });

        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());
        expect(screen.getByTestId("original")).toBeTruthy();
    });

    it("appears when the status becomes known", async () => {
        const view = renderContent({ reviewVm: NO_WORKFLOW });
        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());

        act(() => {
            view.setVm(BOUND_NO_REVIEW);
        });

        expect(await screen.findAllByTestId("editor-review-bar")).toHaveLength(1);
    });
});
