import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CompositionProvider } from "@webiny/react-composition";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageListReviewBulkPublishAction } from "./PageListReviewBulkPublishAction.js";

interface GateStubProps {
    element: React.ReactElement | undefined;
}

vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageList/configs/Browser/BulkAction.js",
    async () => {
        const { makeDecoratable } = await import("@webiny/react-composition");
        interface StubProps {
            name: string;
            element?: React.ReactElement;
        }
        const BulkAction = makeDecoratable("BulkAction", (props: StubProps) => {
            return props.element ?? null;
        });
        return { BulkAction };
    }
);

vi.mock("./PageBulkPublishGate.js", async () => {
    const React = await import("react");
    return {
        PageBulkPublishGate: (props: GateStubProps) => {
            return React.createElement("div", { "data-testid": "gate" }, props.element);
        }
    };
});

const { Browser } = PageListConfig;

describe("PageListReviewBulkPublishAction", () => {
    afterEach(() => {
        cleanup();
    });

    it("gates the bulk Publish and leaves the other bulk actions alone", () => {
        render(
            <CompositionProvider>
                <PageListReviewBulkPublishAction />
                <Browser.BulkAction
                    name={"publishPages"}
                    element={<span data-testid={"publish"} />}
                />
                <Browser.BulkAction
                    name={"unpublishPages"}
                    element={<span data-testid={"unpublish"} />}
                />
            </CompositionProvider>
        );

        expect(screen.getByTestId("publish").closest("[data-testid='gate']")).not.toBeNull();
        expect(screen.getByTestId("unpublish").closest("[data-testid='gate']")).toBeNull();
    });
});
