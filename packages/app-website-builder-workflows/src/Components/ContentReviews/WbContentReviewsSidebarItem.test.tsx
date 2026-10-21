import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Routes } from "~/routes.js";
import { WbContentReviewsSidebarItem } from "./WbContentReviewsSidebarItem.js";

const goToRoute = vi.hoisted(() => vi.fn());

vi.mock("@webiny/icons/work_outline.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { goToRoute };
        }
    };
});

vi.mock("@webiny/app-website-builder", async () => {
    const React = await import("react");
    const Footer = (props: { name: string; element: React.ReactElement }) => {
        return React.createElement(
            "div",
            { "data-testid": "footer", "data-name": props.name },
            props.element
        );
    };
    return { PageListConfig: { Browser: { Sidebar: { Footer } } } };
});

vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();
    const React = await import("react");
    const Item = (props: { text: string; onClick: () => void }) => {
        return React.createElement("button", { onClick: props.onClick }, props.text);
    };
    const ItemIcon = () => React.createElement("span");
    return {
        ...actual,
        Sidebar: { ...actual.Sidebar, Item: Object.assign(Item, { Icon: ItemIcon }) }
    };
});

describe("WbContentReviewsSidebarItem", () => {
    afterEach(() => {
        cleanup();
    });

    it("adds a Content Reviews item to the page list footer that opens the route", () => {
        render(<WbContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer").getAttribute("data-name")).toBe("contentReviews");
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(goToRoute).toHaveBeenCalledTimes(1);
        expect(goToRoute).toHaveBeenCalledWith(Routes.Pages.WorkflowStateList);
    });
});
