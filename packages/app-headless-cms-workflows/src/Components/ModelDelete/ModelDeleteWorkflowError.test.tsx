import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { CompositionProvider } from "@webiny/react-composition";
import { FullyDeleteModelError } from "@webiny/app-headless-cms/presentation/contentModels/components/fullDelete/dialog/FullyDeleteModelError.js";
import type { CmsErrorResponse, CmsModel } from "@webiny/app-headless-cms/types.js";
import { ModelDeleteWorkflowError } from "./ModelDeleteWorkflowError.js";

const hoisted = vi.hoisted(() => {
    return { editor: true };
});

vi.mock("@webiny/app-workflows/presentation/permissions/useWorkflowsPermission.js", () => {
    return { useWorkflowsPermission: () => ({ editor: hoisted.editor }) };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useRouter: () => ({ getLink: () => "/cms/workflows" }) };
});

const model = { modelId: "article", name: "Article" } as CmsModel;

const BOUND: CmsErrorResponse = {
    message: 'The model "article" is used by the workflow "Article review".',
    code: "Workflows/Model/BoundToWorkflow",
    data: { modelId: "article", workflows: [{ id: "wf1", name: "Article review" }] }
};

const renderError = (error: CmsErrorResponse) => {
    return render(
        <AdminUiProvider>
            <CompositionProvider>
                <ModelDeleteWorkflowError />
                <FullyDeleteModelError model={model} error={error} />
            </CompositionProvider>
        </AdminUiProvider>
    );
};

describe("ModelDeleteWorkflowError (UI-18, QBZ-38)", () => {
    it("explains a delete blocked by a workflow and links to it", async () => {
        hoisted.editor = true;
        renderError(BOUND);

        expect(await screen.findByText("Article has a workflow")).toBeTruthy();
        expect(
            screen.getByText("Delete the workflow “Article review” first, then delete the model.")
        ).toBeTruthy();
        expect(screen.getByText("Open workflow →").closest("a")?.getAttribute("href")).toBe(
            "/cms/workflows"
        );
        expect(screen.queryByText(BOUND.message)).toBeNull();
    });

    it("hides the link without Manage workflows", async () => {
        hoisted.editor = false;
        renderError(BOUND);

        expect(
            await screen.findByText(
                "Ask someone with Manage workflows to delete the workflow “Article review” first, then delete the model."
            )
        ).toBeTruthy();
        expect(screen.queryByText("Open workflow →")).toBeNull();
    });

    it("leaves every other delete error as it was", async () => {
        hoisted.editor = true;
        renderError({ message: "Network error.", code: "FULLY_DELETE_MODEL_ERROR", data: {} });

        expect(await screen.findByText("Network error.")).toBeTruthy();
        expect(screen.queryByText(/has a workflow/)).toBeNull();
    });
});
