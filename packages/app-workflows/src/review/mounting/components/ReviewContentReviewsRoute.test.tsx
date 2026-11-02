import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { observable } from "mobx";
import { runInAction } from "mobx";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { Route } from "@webiny/app/features/router/Route.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { ReviewContentTypesVm } from "~/review/presentation/reviewList/IReviewContentTypesSource.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewListPresenterFeature } from "~/review/presentation/reviewList/feature.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { ReviewContentReviewsRoute } from "./ReviewContentReviewsRoute.js";

interface CapturingRouteProps {
    element: React.ReactElement;
}

interface ContentTypesState {
    vm: ReviewContentTypesVm;
}

interface PassthroughProps {
    children?: React.ReactNode;
}

/*
 * The real router keeps the element a route registered with: a later prop change of the mounting
 * component never reaches it. The stub captures the first element the same way.
 */
vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");
    const Passthrough = ({ children }: PassthroughProps) => {
        return React.createElement(React.Fragment, null, children);
    };
    const CapturingRoute = (props: CapturingRouteProps) => {
        const [element] = React.useState(() => props.element);
        return React.createElement("div", { "data-testid": "route" }, element);
    };
    const Breadcrumb = () => {
        return null;
    };
    return {
        ...actual,
        AdminConfig: Object.assign(Passthrough, { Route: CapturingRoute, Breadcrumb }),
        AdminLayout: Passthrough,
        useRoute: () => {
            return { route: { params: {} } };
        }
    };
});

vi.mock("react-helmet", async () => {
    return {
        default: () => {
            return null;
        }
    };
});

vi.mock("~/review/presentation/actionDialog/components/ReviewActionDialogs.js", async () => {
    return {
        ReviewActionDialogs: () => {
            return null;
        }
    };
});

vi.mock("~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js", async () => {
    return {
        ReviewDetailsDrawer: () => {
            return null;
        }
    };
});

const route = new Route({
    name: "Cms/ContentEntries/WorkflowStateList",
    path: "/cms/content-reviews"
});
const rowProvider: IReviewRowProvider = { getBinding: () => null };

describe("ReviewContentReviewsRoute registered before the content types load", () => {
    it("lists the reviews once the content types are known", async () => {
        const container = new Container();
        container.register(ReviewActivity).inSingletonScope();
        container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
        const listReviews = { execute: vi.fn<ListReviewsUseCase.Interface["execute"]>() };
        listReviews.execute.mockResolvedValue({
            items: [],
            meta: { cursor: null, hasMoreItems: false }
        });
        container.registerInstance(ListReviewsUseCase, listReviews);
        ReviewListPresenterFeature.register(container);

        const wrapper = ({ children }: PassthroughProps) => {
            return (
                <AdminUiProvider>
                    <DiContainerProvider container={container}>{children}</DiContainerProvider>
                </AdminUiProvider>
            );
        };
        const contentTypes = observable<ContentTypesState>({
            vm: { loading: true, namespaces: [], options: [] }
        });
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                showContentType={true}
                contentTypes={contentTypes}
                breadcrumbName="cms.content-reviews"
            />,
            { wrapper }
        );
        expect(screen.queryByRole("tablist")).toBeNull();
        expect(listReviews.execute).not.toHaveBeenCalled();

        runInAction(() => {
            contentTypes.vm = {
                loading: false,
                namespaces: ["cms.article"],
                options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
            };
        });

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(1));
        expect(screen.getByRole("tablist")).toBeTruthy();
    });
});
