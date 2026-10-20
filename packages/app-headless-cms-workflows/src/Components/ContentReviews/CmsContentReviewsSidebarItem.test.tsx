import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Routes } from "~/routes.js";
import { CmsContentReviewsSidebarItem } from "./CmsContentReviewsSidebarItem.js";

const goToRoute = vi.hoisted(() => vi.fn());

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { goToRoute };
        }
    };
});

vi.mock("@webiny/app-headless-cms/admin/config/contentEntries/index.js", async () => {
    const React = await import("react");
    const Footer = (props: { name: string; element: React.ReactElement }) => {
        return React.createElement(
            "div",
            { "data-testid": "footer", "data-name": props.name },
            props.element
        );
    };
    const Config = ({ children }: { children: React.ReactNode }) => {
        return React.createElement(React.Fragment, null, children);
    };
    return { ContentEntryListConfig: Object.assign(Config, { Browser: { Sidebar: { Footer } } }) };
});

vi.mock("@webiny/app-headless-cms/exports/admin/cms.js", async () => {
    const React = await import("react");
    return {
        IsModelPublishable: ({ children }: { children: React.ReactNode }) => {
            return React.createElement(React.Fragment, null, children);
        }
    };
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

describe("CmsContentReviewsSidebarItem", () => {
    it("adds a Content Reviews item to the sidebar footer that opens the route", () => {
        render(<CmsContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer").getAttribute("data-name")).toBe("content-reviews");
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(goToRoute).toHaveBeenCalledTimes(1);
        expect(goToRoute).toHaveBeenCalledWith(Routes.ContentEntries.ContentReviews);
    });
});
