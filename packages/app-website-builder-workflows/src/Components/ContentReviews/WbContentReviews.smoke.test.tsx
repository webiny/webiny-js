import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { RouterWithConfig } from "@webiny/app/config/RouterConfig.js";
import { useRouterConfig } from "@webiny/app/config/RouterConfig.js";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { CompositionProvider } from "@webiny/react-composition";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider/abstractions.js";
import { WbContentReviews } from "./WbContentReviews.js";

interface RouteStub {
    path: string;
}

interface RouteParamsStub {
    tab: string;
}

// The menu icon is an svg import; the router is not under test (only `getLink` is read).
vi.mock("@webiny/icons/account_tree.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return {
                getLink: (route: RouteStub, params?: RouteParamsStub) => {
                    if (params) {
                        return `${route.path}?tab=${params.tab}`;
                    }
                    return route.path;
                }
            };
        }
    };
});

const Probe = () => {
    const adminConfig = useAdminConfig();
    const routerConfig = useRouterConfig();

    const menus = adminConfig.menus.map(menu => `${menu.name}:${menu.parent ?? ""}`);
    const widgets = adminConfig.widgets.map(widget => `${widget.name}:${widget.column}`);
    const routes = routerConfig.routes.map(item => item.route.name);

    return (
        <div
            data-testid="probe"
            data-menus={menus.join(",")}
            data-widgets={widgets.join(",")}
            data-routes={routes.join(",")}
        />
    );
};

describe("WbContentReviews under the real admin and router configs", () => {
    afterEach(() => {
        cleanup();
    });

    it("registers the route, the menu item and the two widgets", async () => {
        const container = new Container();
        container.registerInstance(WbReviewContentAdapter, {} as unknown as IReviewContentAdapter);
        container.registerInstance(WbReviewRowProvider, {
            getBinding: () => null
        } as IReviewRowProvider);

        render(
            <DiContainerProvider container={container}>
                <CompositionProvider>
                    {/* Mirrors App.tsx: the config declarations and the admin plugin come before the router, which renders its children only after its first config flush. */}
                    <WbContentReviews />
                    <AdminWithConfig>
                        {AdminConfigPlugin}
                        <RouterWithConfig>
                            <Probe />
                        </RouterWithConfig>
                    </AdminWithConfig>
                </CompositionProvider>
            </DiContainerProvider>
        );

        const probe = await screen.findByTestId("probe");
        await vi.waitFor(() => {
            expect(probe.getAttribute("data-routes")).toBe(
                "WebsiteBuilder/Pages/WorkflowStateList"
            );
        });
        expect(probe.getAttribute("data-menus")).toBe("workflows.wb.contentReviews:wb");
        expect(probe.getAttribute("data-widgets")).toBe(
            "workflows.wb.review:right,workflows.wb.requested:right"
        );
    });
});
