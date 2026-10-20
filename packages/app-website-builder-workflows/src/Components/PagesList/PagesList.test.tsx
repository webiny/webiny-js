import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { PagesList } from "./PagesList.js";

vi.mock("@webiny/app-website-builder", async () => {
    const React = await import("react");
    const Config = ({ children }: { children: React.ReactNode }) => {
        return React.createElement("div", { "data-testid": "page-list-config" }, children);
    };
    return {
        PageListConfig: Object.assign(Config, { Browser: { Sidebar: { Footer: () => null } } })
    };
});

vi.mock("./PageListChangeStatus.js", async () => {
    const React = await import("react");
    return {
        PageListChangeStatus: () => React.createElement("div", { "data-testid": "change-status" })
    };
});

vi.mock("~/Components/ContentReviews/WbContentReviewsSidebarItem.js", async () => {
    const React = await import("react");
    return {
        WbContentReviewsSidebarItem: () =>
            React.createElement("div", { "data-testid": "wb-content-reviews-sidebar" })
    };
});

describe("PagesList", () => {
    afterEach(() => {
        cleanup();
    });

    it("mounts the Content Reviews sidebar item next to the change status decoration", () => {
        render(<PagesList />);

        expect(screen.getByTestId("wb-content-reviews-sidebar")).toBeTruthy();
        expect(screen.getByTestId("change-status")).toBeTruthy();
    });
});
