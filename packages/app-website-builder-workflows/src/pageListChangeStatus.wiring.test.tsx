import React from "react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { CompositionProvider } from "@webiny/react-composition";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { usePageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageListWithConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { TableRowMapper as BaseTableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/TableRowMapper.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { Routes } from "~/routes.js";
import "~/types.js";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

const goToRoute = vi.hoisted(() => vi.fn());

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useFeatureFlags: () => ({ isEnabled: () => flags.enabled }),
        useRouter: () => ({ goToRoute })
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

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
    return { WbContentReviews: () => null };
});

/*
 * The row action host needs the page list shell; the stub renders the element it is given, so what
 * decides visibility is the real decorator that the real PagesList mounts through the real config.
 */
vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageList/configs/Browser/PageAction.js",
    async () => {
        const { makeDecoratable } = await import("@webiny/react-composition");
        interface StubProps {
            name: string;
            element?: React.ReactElement;
        }
        const PageAction = makeDecoratable("PageAction", (props: StubProps) => {
            return props.element ?? null;
        });
        return { PageAction };
    }
);

const { Browser } = PageListConfig;

const createDto = (reviewState: ReviewStateValue | null) => {
    let system = null;
    if (reviewState !== null) {
        system = {
            workflow: {
                workflowId: "workflow-1",
                reviewState,
                stepId: "step-1",
                stepName: "Legal",
                stepState: StepState.InReview
            }
        };
    }
    const page = Page.create({ id: "page-1#0001", entryId: "page-1", system });
    return PageDtoMapper.toDTO(page);
};

/* Renders the sidebar footer slot the way the page list does. */
const SidebarFooterProbe = () => {
    const { browser } = usePageListConfig();

    return (
        <div data-testid={"sidebar-footer"}>
            {browser.sidebarFooter.map(footer => (
                <div key={footer.name} data-name={footer.name}>
                    {footer.element}
                </div>
            ))}
        </div>
    );
};

/* The page list renders its children once the config has been collected. */
const waitForActions = async () => {
    await screen.findByTestId("edit");
};

const mountRoot = (enabled: boolean, reviewState: ReviewStateValue | null) => {
    flags.enabled = enabled;
    const container = new Container();
    container.register(BaseTableRowMapper);
    container.registerInstance(PageListCache, new ListCache<Page>("entryId"));
    container.registerInstance(FullPageCache, new ListCache<Page>("id"));
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    container.registerInstance(ReviewNotificationService, { handle: vi.fn() });

    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <WebsiteBuilderWorkflows />
                {/* A neutral config entry, so the page list config flushes with the flag off too. */}
                <PageListConfig>
                    <Browser.Sidebar.Footer name={"neutral"} element={<span />} />
                </PageListConfig>
                <PageListWithConfig>
                    <SidebarFooterProbe />
                    <PageProvider page={createDto(reviewState)}>
                        <Browser.Page.Action
                            name={"changeStatus"}
                            element={<span data-testid={"change-status"} />}
                        />
                        <Browser.Page.Action
                            name={"edit"}
                            element={<span data-testid={"edit"} />}
                        />
                    </PageProvider>
                </PageListWithConfig>
            </CompositionProvider>
        </DiContainerProvider>
    );
};

describe("Website Builder Change status decoration from the composition root", () => {
    afterEach(() => {
        cleanup();
        goToRoute.mockReset();
    });

    it("flag on: the action is hidden for a page whose review is in progress", async () => {
        mountRoot(true, ReviewState.InProgress);

        await waitForActions();
        expect(screen.queryAllByTestId("change-status")).toHaveLength(0);
        expect(screen.queryAllByTestId("edit")).toHaveLength(1);
    });

    it("flag on: the action is shown for an approved review", async () => {
        mountRoot(true, ReviewState.Approved);

        await waitForActions();
        expect(screen.queryAllByTestId("change-status")).toHaveLength(1);
    });

    it("flag on: the action is shown for a page with no review", async () => {
        mountRoot(true, null);

        await waitForActions();
        expect(screen.queryAllByTestId("change-status")).toHaveLength(1);
    });

    it("flag off: the action is left untouched even for a review in progress", async () => {
        mountRoot(false, ReviewState.InProgress);

        await waitForActions();
        expect(screen.queryAllByTestId("change-status")).toHaveLength(1);
    });

    it("flag on: the Content Reviews sidebar item is mounted and opens the route", async () => {
        mountRoot(true, null);

        await waitForActions();
        const footer = screen.getByTestId("sidebar-footer");
        expect(footer.querySelector('[data-name="contentReviews"]')).not.toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));
        expect(goToRoute).toHaveBeenCalledWith(Routes.Pages.WorkflowStateList);
    });

    it("flag off: no Content Reviews sidebar item is mounted", async () => {
        mountRoot(false, null);

        await waitForActions();
        const footer = screen.getByTestId("sidebar-footer");
        expect(footer.querySelector('[data-name="contentReviews"]')).toBeNull();
        expect(screen.queryByRole("button", { name: "Content Reviews" })).toBeNull();
    });
});
