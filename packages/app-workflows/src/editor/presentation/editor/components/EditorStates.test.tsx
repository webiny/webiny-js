import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { EditorDetailLoading } from "./EditorDetailLoading.js";
import { EditorLoadError } from "./EditorLoadError.js";
import { EditorLoading } from "./EditorLoading.js";
import { EditorNoPermission } from "./EditorNoPermission.js";
import { NoWorkflowState } from "./NoWorkflowState.js";

describe("EditorLoading", () => {
    it("renders the static skeleton", () => {
        renderWithAdminUi(<EditorLoading />);

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
        expect(screen.getAllByTestId("editor-skeleton-card")).toHaveLength(3);
    });
});

describe("EditorDetailLoading", () => {
    it("renders the skeleton cards of a loading workflow", () => {
        renderWithAdminUi(<EditorDetailLoading />);

        expect(screen.getByTestId("editor-detail-loading")).toBeTruthy();
        expect(screen.getAllByTestId("editor-skeleton-card")).toHaveLength(3);
    });
});

describe("EditorLoadError", () => {
    it("shows the title, the error and Try again", () => {
        const onRetry = vi.fn();
        renderWithAdminUi(<EditorLoadError description="Network down." onRetry={onRetry} />);

        expect(screen.getByText("Could not load workflows")).toBeTruthy();
        expect(screen.getByText("Network down.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});

describe("EditorNoPermission", () => {
    it("explains the missing permission", () => {
        renderWithAdminUi(<EditorNoPermission />);

        expect(screen.getByText("You don't have access to workflows")).toBeTruthy();
        expect(
            screen.getByText(
                "Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role."
            )
        ).toBeTruthy();
    });
});

describe("NoWorkflowState", () => {
    it("shows the title, the description and Create workflow", () => {
        const onCreate = vi.fn();
        renderWithAdminUi(
            <NoWorkflowState
                title="Article has no workflow"
                description="Add a workflow to require a review before Article content can be published."
                onCreate={onCreate}
            />
        );

        expect(screen.getByText("Article has no workflow")).toBeTruthy();
        expect(
            screen.getByText(
                "Add a workflow to require a review before Article content can be published."
            )
        ).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Create workflow" }));
        expect(onCreate).toHaveBeenCalledTimes(1);
    });
});
