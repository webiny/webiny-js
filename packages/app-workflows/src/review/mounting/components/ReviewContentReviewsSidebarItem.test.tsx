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
import { Route } from "@webiny/app/features/router/Route.js";
import { ReviewContentReviewsSidebarItem } from "./ReviewContentReviewsSidebarItem.js";

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

vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();
    const React = await import("react");
    const Item = (props: {
        text: string;
        className?: string;
        icon: React.ReactElement;
        onClick: () => void;
    }) => {
        return React.createElement(
            "button",
            { onClick: props.onClick, className: props.className },
            props.icon,
            props.text
        );
    };
    const ItemIcon = (props: { element: React.ReactElement }) => props.element;
    return {
        ...actual,
        Sidebar: { ...actual.Sidebar, Item: Object.assign(Item, { Icon: ItemIcon }) }
    };
});

const ROUTE = new Route({ name: "Test/ContentReviews", path: "/test/content-reviews" });

describe("ReviewContentReviewsSidebarItem", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders a Content Reviews item with the given icon that opens the route", () => {
        render(<ReviewContentReviewsSidebarItem route={ROUTE} icon={<i data-testid={"icon"} />} />);

        expect(screen.getByTestId("icon")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(goToRoute).toHaveBeenCalledTimes(1);
        expect(goToRoute).toHaveBeenCalledWith(ROUTE);
    });

    it("passes the class name to the item", () => {
        render(<ReviewContentReviewsSidebarItem route={ROUTE} icon={<i />} className={"w-full"} />);

        expect(screen.getByRole("button").className).toBe("w-full");
    });
});
