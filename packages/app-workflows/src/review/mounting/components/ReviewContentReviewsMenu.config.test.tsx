import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { Route } from "@webiny/app/features/router/Route.js";
import { CompositionProvider } from "@webiny/react-composition";
import { ReviewContentReviewsMenu } from "./ReviewContentReviewsMenu.js";

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { getLink: (route: { path: string }) => route.path };
        }
    };
});

const route = new Route({
    name: "Cms/ContentEntries/WorkflowStateList",
    path: "/cms/content-reviews"
});

const Probe = () => {
    const { menus } = useAdminConfig();
    const names = menus.map(menu => `${menu.name}:${menu.parent ?? ""}`);

    return <div data-testid="probe" data-menus={names.join(",")} />;
};

describe("ReviewContentReviewsMenu under the real admin config", () => {
    afterEach(() => {
        cleanup();
    });

    it("registers the menu item with the real AdminConfig instead of throwing", async () => {
        render(
            <CompositionProvider>
                <ReviewContentReviewsMenu
                    name="workflows.cms.contentReviews"
                    route={route}
                    parent="cms"
                />
                <AdminWithConfig>
                    {AdminConfigPlugin}
                    <Probe />
                </AdminWithConfig>
            </CompositionProvider>
        );

        const probe = await screen.findByTestId("probe");
        await vi.waitFor(() => {
            expect(probe.getAttribute("data-menus")).toBe("workflows.cms.contentReviews:cms");
        });
    });
});
