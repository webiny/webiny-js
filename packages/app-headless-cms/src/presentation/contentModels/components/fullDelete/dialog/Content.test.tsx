/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { CmsModel } from "~/types.js";
import { FullyDeleteModelStateStatus } from "../types.js";
import { Content } from "./Content.js";

interface FakeAlertProps {
    children?: React.ReactNode;
}

// The real Alert renders svg icons, which this package's tests do not load.
vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();
    return {
        ...actual,
        Alert: (props: FakeAlertProps) => <div role={"alert"}>{props.children}</div>
    };
});

const model = { modelId: "article", name: "Article" } as CmsModel;

describe("Content of the fully delete model dialog", () => {
    it("shows only the error after the server refused the delete", () => {
        const view = render(
            <AdminUiProvider>
                <Content
                    model={model}
                    confirmation={"delete article"}
                    setConfirmation={() => undefined}
                    error={{ message: "The model is used by a workflow.", code: "X", data: {} }}
                    status={FullyDeleteModelStateStatus.ERROR}
                />
            </AdminUiProvider>
        );

        expect(view.getByText("The model is used by a workflow.")).toBeTruthy();
        expect(view.queryByText(/Are you sure/)).toBeNull();
        expect(view.queryAllByTestId("cms-delete-content-model-input")).toHaveLength(0);
    });

    it("keeps the confirmation input with a wrong confirmation text", () => {
        const view = render(
            <AdminUiProvider>
                <Content
                    model={model}
                    confirmation={"nope"}
                    setConfirmation={() => undefined}
                    error={{
                        message: "Confirmation value is not correct.",
                        code: "CONFIRMATION_ERROR",
                        data: {}
                    }}
                    status={FullyDeleteModelStateStatus.UNDERSTOOD}
                />
            </AdminUiProvider>
        );

        expect(view.getByText("Confirmation value is not correct.")).toBeTruthy();
        expect(view.getAllByTestId("cms-delete-content-model-input").length).toBeGreaterThan(0);
    });
});
