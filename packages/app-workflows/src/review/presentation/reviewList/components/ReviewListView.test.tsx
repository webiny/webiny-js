import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity as ReviewActivityAbstraction } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListRouteParams } from "../abstractions.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { ReviewListPresenterFeature } from "../feature.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReassignDialogPresenterFeature } from "~/review/presentation/actionDialog/reassignFeature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { ReviewerPickerPresenterFeature } from "~/review/presentation/reviewerPicker/feature.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createStep } from "~/review/testing/createStep.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import { ReviewListView } from "./ReviewListView.js";

type ListResult = ReviewListPage | Error;

const page = (
    items: ReturnType<typeof createReviewListItem>[],
    cursor: string | null = null,
    hasMoreItems = false
): ReviewListPage => {
    return { items, meta: { cursor, hasMoreItems } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: namespace => {
        if (!namespace.startsWith("cms.")) {
            return null;
        }
        return {
            getContentUrl: ref => {
                return `/cms/content-entries/${ref.contentTypeId}?id=${encodeURIComponent(ref.targetRevisionId)}`;
            },
            getContentTypeLabel: contentTypeId => {
                return `Type ${contentTypeId}`;
            },
            renderContentTypeIcon: contentTypeId => {
                return <span data-testid={`type-icon-${contentTypeId}`} />;
            }
        };
    }
};

const REASSIGN: IPermission[] = [{ name: "workflows", reassign: true }];

interface RenderOptions {
    results?: ListResult[];
    showContentType?: boolean;
    contentTypeFilter?: IReviewContentTypeFilter | null;
    initialScope?: ReviewListScope;
    initialState?: ReviewListState;
    permissions?: IPermission[];
    loading?: boolean;
    teams?: ITeam[];
    onRouteChange?: (params: ReviewListRouteParams) => void;
}

interface RerenderOptions {
    initialScope?: ReviewListScope;
    initialState?: ReviewListState;
}

const renderView = (options: RenderOptions = {}) => {
    const container = new Container();
    container.register(ReviewActivity).inSingletonScope();
    const teams: ITeam[] = options.teams ?? [{ id: "team-1", slug: "team-1", name: "Team 1" }];
    const identityContext = createWorkflowsIdentityContext({
        teams,
        permissions: options.permissions
    });
    container.registerInstance(IdentityContext, identityContext);
    const listReviews = { execute: vi.fn<ListReviewsUseCase.Interface["execute"]>() };
    container.registerInstance(ListReviewsUseCase, listReviews);
    // The real row dialogs and details drawer, over use-case fakes (D186).
    const fakes = createReviewUseCaseFakes();
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewListPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    ReviewerPickerPresenterFeature.register(container);
    ReviewDetailsPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);

    listReviews.execute.mockResolvedValue(page([]));
    if (options.loading) {
        listReviews.execute.mockReturnValue(new Promise(() => undefined));
    }
    (options.results ?? [page([])]).forEach(result => {
        if (result instanceof Error) {
            listReviews.execute.mockRejectedValueOnce(result);
            return;
        }
        listReviews.execute.mockResolvedValueOnce(result);
    });
    const namespaces = ["cms.article", "other.app"];
    const element = (route: RerenderOptions) => {
        return (
            <DiContainerProvider container={container}>
                <ReviewListView
                    app={"cms"}
                    rowProvider={rowProvider}
                    namespaces={namespaces}
                    showContentType={options.showContentType ?? true}
                    contentTypeFilter={options.contentTypeFilter ?? null}
                    initialScope={route.initialScope}
                    initialState={route.initialState}
                    onRouteChange={options.onRouteChange}
                />
            </DiContainerProvider>
        );
    };
    const rendered = renderWithAdminUi(element(options));
    // The route changed: the page renders the view again with the new values.
    const rerenderRoute = (route: RerenderOptions) => {
        rendered.rerender(<AdminUiProvider>{element(route)}</AdminUiProvider>);
    };

    return { activity, listReviews, fakes, rerenderRoute };
};

// The review a row's dialog or drawer reads: one current step, every action allowed.
const loadedReview = (reviewId: string, step: Partial<ReviewStep>): ReviewWithFlags => {
    const current = createStep(step);
    const review = createReview({
        id: reviewId,
        title: "Loaded review",
        currentStepId: current.id,
        currentStepState: current.state,
        steps: [current]
    });
    const flags = createFlags({
        canStart: true,
        canReassign: true,
        canCancel: true,
        canRestart: true
    });
    return createReviewWithFlags(review, flags);
};

const lastButton = (label: string): HTMLElement => {
    return screen.getAllByText(label, { selector: "button *, button" }).pop() as HTMLElement;
};

const rowOf = (title: string): HTMLElement => {
    return screen.getByText(title).closest("tr") as HTMLElement;
};

const isHighlighted = (title: string): boolean => {
    return rowOf(title).querySelector("[data-highlighted]") !== null;
};

const columnHeader = (name: string): HTMLElement => {
    return screen.getByRole("columnheader", { name: new RegExp(`^${name}`) });
};

// The table shows the sort arrow, labelled "Sort column", only in the sorted column's header.
const isSortedBy = (name: string): boolean => {
    return within(columnHeader(name)).queryByText("Sort column") !== null;
};

const clickHeader = (name: string): void => {
    fireEvent.click(within(columnHeader(name)).getByText(name));
};

const openMenu = (title: string): void => {
    const trigger = within(rowOf(title)).getByRole("button", { name: `Actions for ${title}` });
    fireEvent.keyDown(trigger, { key: "Enter" });
};

describe("ReviewListView", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("lists the reviews of the app the route passes (R348)", async () => {
        const { listReviews } = renderView({ results: [page([])] });

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(1));

        expect(listReviews.execute.mock.calls[0][0].app).toBe("cms");
    });

    it("renders rows of two namespaces and degrades the unbound one (R206)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "bound",
                        title: "Bound review",
                        namespace: "cms.article",
                        modelId: "article",
                        targetRevisionId: "e1#0001",
                        flags: { canStart: true }
                    }),
                    createReviewListItem({
                        id: "unbound",
                        title: "Unbound review",
                        namespace: "other.app",
                        flags: { canStart: true, canCancel: true }
                    })
                ])
            ]
        });

        const link = await screen.findByRole("link", { name: "Bound review" });
        expect(link.getAttribute("href")).toBe("/cms/content-entries/article?id=e1%230001");
        expect(screen.getByText("Type article")).toBeTruthy();
        openMenu("Bound review");
        expect(await screen.findByRole("menuitem", { name: "Start" })).toBeTruthy();
        expect(screen.getByRole("menuitem", { name: "Open in new window" })).toBeTruthy();
        fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

        expect(screen.queryByRole("link", { name: "Unbound review" })).toBeNull();
        const unbound = within(rowOf("Unbound review"));
        expect(unbound.queryByRole("button", { name: "Start" })).toBeNull();
        expect(unbound.queryByRole("button", { name: "Actions for Unbound review" })).toBeNull();
    });

    it("shows the actions the flags allow and nothing else (D5, D54)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "can-start",
                        title: "Can start",
                        flags: { canStart: true }
                    }),
                    createReviewListItem({
                        id: "can-take",
                        title: "Can take",
                        flags: { canTakeOver: true }
                    }),
                    createReviewListItem({ id: "none", title: "No actions" })
                ])
            ]
        });

        await screen.findByText("Can start");

        openMenu("Can start");
        expect(await screen.findByRole("menuitem", { name: "Start" })).toBeTruthy();
        expect(screen.queryByRole("menuitem", { name: "Take over" })).toBeNull();
        fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
        await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Start" })).toBeNull());

        openMenu("Can take");
        expect(await screen.findByRole("menuitem", { name: "Take over" })).toBeTruthy();
        expect(screen.queryByRole("menuitem", { name: "Start" })).toBeNull();
        fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
        await waitFor(() =>
            expect(screen.queryByRole("menuitem", { name: "Take over" })).toBeNull()
        );

        const none = within(rowOf("No actions"));
        expect(none.queryByRole("button", { name: "Start" })).toBeNull();
        expect(none.getByRole("button", { name: "Actions for No actions" })).toBeTruthy();
    });

    it("opens the dialog of an inline action on the row's use cases and refetches once when it is done", async () => {
        const { listReviews, fakes } = renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        stepId: "step-7",
                        flags: { canStart: true }
                    })
                ]),
                page([])
            ]
        });
        fakes.getReview.execute.mockResolvedValue(
            loadedReview("r1", { id: "step-7", title: "Legal sign-off", state: StepState.Awaiting })
        );
        await screen.findByText("Review one");

        openMenu("Review one");
        fireEvent.click(await screen.findByText("Start"));

        expect(await screen.findByText("Start “Legal sign-off”?")).toBeTruthy();
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "r1"
        });

        fireEvent.click(lastButton("Start"));

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(fakes.startReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "r1",
            stepId: "step-7"
        });
        await waitFor(() => expect(screen.queryByText("Start “Legal sign-off”?")).toBeNull());
    });

    it("ends a Start conflict with 'The list has been refreshed.' and refreshes the list behind the open dialog (R220, R242, QBZ-31)", async () => {
        const { listReviews, fakes } = renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        stepId: "step-7",
                        flags: { canStart: true }
                    })
                ]),
                page([])
            ]
        });
        fakes.getReview.execute.mockResolvedValue(
            loadedReview("r1", { id: "step-7", title: "Legal sign-off", state: StepState.Awaiting })
        );
        fakes.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        await screen.findByText("Review one");
        openMenu("Review one");
        fireEvent.click(await screen.findByText("Start"));
        await screen.findByText("Start “Legal sign-off”?");
        expect(listReviews.execute).toHaveBeenCalledTimes(1);

        fireEvent.click(lastButton("Start"));

        expect(await screen.findByText(/The list has been refreshed\./)).toBeTruthy();
        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        // The dialog stays open for the conflict message; only the list refetched.
        expect(screen.getByText("Someone else acted first")).toBeTruthy();
    });

    it("orders the row menu as in the design and opens the content in a new window", async () => {
        const open = vi.fn();
        vi.stubGlobal("open", open);
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        flags: { canReassign: true, canCancel: true }
                    })
                ])
            ]
        });
        await screen.findByText("Review one");

        openMenu("Review one");
        fireEvent.click(await screen.findByText("Open in new window"));
        expect(open).toHaveBeenCalledWith(
            "/cms/content-entries/article?id=entry-r1%230001",
            "_blank",
            "noopener,noreferrer"
        );

        await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
        openMenu("Review one");
        await screen.findByRole("menuitem", { name: "Open content" });
        const names = screen.getAllByRole("menuitem").map(item => item.textContent);
        expect(names).toEqual([
            "Open content",
            "Open in new window",
            "View details",
            "Reassign",
            "Cancel review"
        ]);
    });

    it("opens the menu actions and View details", async () => {
        const { fakes } = renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        stepId: "step-3",
                        flags: { canReassign: true, canCancel: true }
                    })
                ])
            ]
        });
        fakes.getReview.execute.mockResolvedValue(
            loadedReview("r1", { id: "step-3", title: "Legal sign-off", state: StepState.InReview })
        );
        await screen.findByText("Review one");

        const more = within(rowOf("Review one")).getByRole("button", {
            name: "Actions for Review one"
        });
        fireEvent.keyDown(more, { key: "Enter" });
        expect(await screen.findByRole("menuitem", { name: "Reassign" })).toBeTruthy();
        expect(screen.getByRole("menuitem", { name: "Cancel review" })).toBeTruthy();
        // The item's onClick sits on its inner element, so click the label.
        fireEvent.click(screen.getByText("Reassign"));

        expect(await screen.findByText("Reassign “Legal sign-off”")).toBeTruthy();
        fireEvent.click(lastButton("Close"));
        await waitFor(() => expect(screen.queryByText("Reassign “Legal sign-off”")).toBeNull());

        fireEvent.keyDown(more, { key: "Enter" });
        await screen.findByRole("menuitem", { name: "View details" });
        fireEvent.click(screen.getByText("View details"));

        expect(await screen.findByText("Loaded review")).toBeTruthy();
        expect(fakes.getReview.execute).toHaveBeenLastCalledWith({
            namespace: "cms.article",
            reviewId: "r1"
        });
        // The row's content type label and URL reach the drawer's content link.
        const contentLink = (await screen.findByText(/^Type .+ · .+\(#\d+\)$/)).closest("a");
        expect(contentLink?.getAttribute("href")).toMatch(/^\/cms\/content-entries\//);
    });

    it("refetches the list when the details drawer reports a change", async () => {
        const { listReviews, fakes } = renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        flags: { canReassign: true }
                    })
                ]),
                page([])
            ]
        });
        fakes.getReview.execute.mockResolvedValue(
            loadedReview("r1", { id: "step-1", title: "Legal sign-off", state: StepState.Awaiting })
        );
        fakes.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        await screen.findByText("Review one");
        const more = within(rowOf("Review one")).getByRole("button", {
            name: "Actions for Review one"
        });
        fireEvent.keyDown(more, { key: "Enter" });
        await screen.findByRole("menuitem", { name: "View details" });
        fireEvent.click(screen.getByText("View details"));
        await screen.findByText("Loaded review");
        fireEvent.click(lastButton("Start"));
        await screen.findByText("Start “Legal sign-off”?");
        expect(listReviews.execute).toHaveBeenCalledTimes(1);

        // A conflict in the drawer's dialog makes the drawer report a change.
        fireEvent.click(lastButton("Start"));

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
    });

    it("shows the notice for new reviews and Show reloads the first page", async () => {
        const { activity, listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "old", title: "Old review" })]),
                page([
                    createReviewListItem({ id: "old", title: "Old review" }),
                    createReviewListItem({ id: "fresh", title: "Fresh review" })
                ]),
                page([
                    createReviewListItem({ id: "fresh", title: "Fresh review" }),
                    createReviewListItem({ id: "old", title: "Old review" })
                ])
            ]
        });
        await screen.findByText("Old review");

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        expect(await screen.findByText("New reviews are available.")).toBeTruthy();
        expect(screen.queryByText("Fresh review")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Show" }));

        expect(await screen.findByText("Fresh review")).toBeTruthy();
        expect(screen.queryByText("New reviews are available.")).toBeNull();
        expect(listReviews.execute).toHaveBeenCalledTimes(3);
    });

    it("removes a review that left the tab without a transition event", async () => {
        const { activity } = renderView({
            results: [
                page([
                    createReviewListItem({ id: "stays", title: "Stays here" }),
                    createReviewListItem({ id: "gone", title: "Gone review" })
                ]),
                page([createReviewListItem({ id: "stays", title: "Stays here" })])
            ]
        });
        await screen.findByText("Gone review");

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        await waitFor(() => expect(screen.queryByText("Gone review")).toBeNull());
        expect(screen.getByText("Stays here")).toBeTruthy();
    });

    it("highlights a row whose review changed and not the unchanged ones (QBZ-86)", async () => {
        const { activity } = renderView({
            results: [
                page([
                    createReviewListItem({ id: "changes", title: "Will change" }),
                    createReviewListItem({ id: "same", title: "Stays the same" })
                ]),
                page([
                    createReviewListItem({
                        id: "changes",
                        title: "Will change",
                        stepState: StepState.InReview
                    }),
                    createReviewListItem({ id: "same", title: "Stays the same" })
                ])
            ]
        });
        await screen.findByText("Will change");
        expect(isHighlighted("Will change")).toBe(false);

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        await waitFor(() => {
            expect(isHighlighted("Will change")).toBe(true);
        });
        expect(isHighlighted("Stays the same")).toBe(false);
    });

    it("drops a row that left the tab", async () => {
        const { activity } = renderView({
            results: [
                page([
                    createReviewListItem({ id: "stays", title: "Stays here" }),
                    createReviewListItem({ id: "gone", title: "Gone review" })
                ]),
                page([createReviewListItem({ id: "stays", title: "Stays here" })])
            ]
        });
        await screen.findByText("Gone review");

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        await waitFor(() => expect(screen.queryByText("Gone review")).toBeNull());
        expect(screen.getByText("Stays here")).toBeTruthy();
    });

    it("renders the current step name as Text inside its tag", async () => {
        renderView({ results: [page([createReviewListItem({ id: "r1", title: "First" })])] });
        await screen.findByText("First");

        const text = rowOf("First").querySelector("[data-role='current-step-text']");
        expect(text).not.toBeNull();
        expect(text!.textContent).not.toBe("");
    });

    it("renders no step dot for a row without a current step", async () => {
        const base = createReviewListItem({ id: "no-step", title: "No step review" });
        const withoutStep = createReviewWithFlags(
            { ...base.review, currentStepId: null, steps: [] },
            base.flags
        );
        renderView({ results: [page([withoutStep])] });

        await screen.findByText("No step review");

        const row = rowOf("No step review");
        expect(row.querySelector("[style*='background']")).toBeNull();
    });

    it("loads more by cursor and counts the shown reviews in the bottom bar", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "First page" })], "c1", true),
                page([createReviewListItem({ id: "r2", title: "Second page" })], null, false)
            ]
        });
        await screen.findByText("First page");
        expect(screen.getByText("Showing 1 review.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Load more" }));

        expect(await screen.findByText("Second page")).toBeTruthy();
        expect(await screen.findByText("Showing 2 reviews.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ after: "c1" })
        );
    });

    it("shows the failed state and retries", async () => {
        const { listReviews } = renderView({
            results: [
                new Error("network"),
                page([createReviewListItem({ id: "r1", title: "Back again" })])
            ]
        });

        expect(await screen.findByText("Could not load reviews")).toBeTruthy();
        expect(screen.getByText("The server did not respond. Try again in a moment.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Back again")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledTimes(2);
    });

    const scopeControl = () => screen.getByRole("radiogroup", { name: "Whose reviews" });
    const stateControl = () => screen.getByRole("radiogroup", { name: "Review state" });
    const radioLabels = (group: HTMLElement) => {
        return within(group)
            .getAllByRole("radio")
            .map(radio => radio.textContent);
    };

    it("shows the empty state of the scope and switches scopes", async () => {
        const { listReviews } = renderView({ results: [page([]), page([])] });

        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();

        fireEvent.click(within(scopeControl()).getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({
                scope: "pool",
                where: { state: "inReview" },
                sort: "lastChangedOn_ASC"
            })
        );
    });

    it("renders the four scopes and the five states in design order, with accessible names", async () => {
        renderView();
        await screen.findByText("Nothing assigned to you");

        expect(radioLabels(scopeControl())).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "Requested by me",
            "All"
        ]);
        expect(radioLabels(stateControl())).toEqual([
            "All",
            "In review",
            "Failed",
            "Approved",
            "Rejected"
        ]);
        const inReview = within(stateControl()).getByRole("radio", { name: "In review" });
        expect(inReview.getAttribute("aria-checked")).toBe("true");
    });

    it("renders All as the fifth scope for a viewer with the editor permission only (B7)", async () => {
        renderView({ permissions: [{ name: "workflows", editor: true }] });
        await screen.findByText("Nothing assigned to you");

        expect(radioLabels(scopeControl())).toHaveLength(5);
        expect(radioLabels(scopeControl())).toContain("All");
    });

    it("disables the states empty by definition for the scope, without hiding them", async () => {
        renderView({ initialScope: "pool" });
        await screen.findByText("Your team pools are empty");

        const disabled = within(stateControl())
            .getAllByRole("radio")
            .filter(radio => radio.hasAttribute("disabled"))
            .map(radio => radio.textContent);
        expect(disabled).toEqual(["Failed", "Approved", "Rejected"]);
    });

    it("tells a viewer in no team to ask a workflow manager, with no action (B17)", async () => {
        renderView({ initialScope: "pool", teams: [] });

        expect(await screen.findByText("You’re not in a reviewing team")).toBeTruthy();
        expect(
            screen.getByText(
                "Ask a workflow manager to add you to a team that reviews Headless CMS content."
            )
        ).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    });

    it("explains a disabled state in a tooltip on hover (B8)", async () => {
        renderView({ initialScope: "pool" });
        await screen.findByText("Your team pools are empty");

        const approved = within(stateControl()).getByRole("radio", { name: "Approved" });
        const label = approved.querySelector(
            "[data-role='review-list-state-disabled']"
        ) as HTMLElement;
        fireEvent.pointerMove(label);
        fireEvent.focus(label);

        expect(
            (await screen.findAllByText("Team pool only holds open reviews.")).length
        ).toBeGreaterThan(0);
        const inReview = within(stateControl()).getByRole("radio", { name: "In review" });
        expect(inReview.querySelector("[data-role='review-list-state-disabled']")).toBeNull();
    });

    it("switches the state and keeps the scope", async () => {
        const { listReviews } = renderView({
            initialScope: "myRequests",
            results: [page([]), page([])]
        });
        await screen.findByText("You haven’t requested any reviews");

        fireEvent.click(within(stateControl()).getByRole("radio", { name: "Approved" }));

        expect(await screen.findByText("No reviews match these filters")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({
                scope: "myRequests",
                where: { state: "approved" },
                sort: "lastChangedOn_DESC"
            })
        );
    });

    it("opens the scope and state named by the route with reassign and shows their empty state (QBZ-29)", async () => {
        const { listReviews } = renderView({
            initialScope: "all",
            initialState: "failed",
            permissions: REASSIGN
        });

        expect(await screen.findByText("No failed steps")).toBeTruthy();
        expect(
            screen.getByText("AI and automation steps that hit a technical error appear here.")
        ).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: "all",
                where: { state: "failed" },
                sort: "lastChangedOn_ASC"
            })
        );
        const all = within(scopeControl()).getByRole("radio", { name: "All" });
        expect(all.getAttribute("aria-checked")).toBe("true");
    });

    it("opens All when the route asks for it without permission (B7)", async () => {
        const { listReviews } = renderView({ initialScope: "all", initialState: "failed" });

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(1));
        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({ scope: "all", where: { state: "failed" } })
        );
        const all = within(scopeControl()).getByRole("radio", { name: "All" });
        expect(all.getAttribute("aria-checked")).toBe("true");
    });

    it("switches to All from the scope control without permission and shows its empty state", async () => {
        const { listReviews } = renderView({
            results: [page([]), page([])]
        });
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(within(scopeControl()).getByRole("radio", { name: "All" }));

        expect(await screen.findByText("No reviews yet")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ scope: "all", where: { state: "inReview" } })
        );
    });

    it("writes a scope and state change to the route and keeps the list when the route comes back", async () => {
        const onRouteChange = vi.fn<(params: ReviewListRouteParams) => void>();
        const { listReviews, rerenderRoute } = renderView({ onRouteChange });
        await screen.findByText("Nothing assigned to you");
        expect(onRouteChange).not.toHaveBeenCalled();

        fireEvent.change(screen.getByPlaceholderText("Search..."), {
            target: { value: "budget" }
        });
        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));

        fireEvent.click(within(scopeControl()).getByRole("radio", { name: "Requested by me" }));
        expect(onRouteChange).toHaveBeenLastCalledWith({ scope: "myRequests", state: "inReview" });
        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(3));

        rerenderRoute({ initialScope: "myRequests", initialState: "inReview" });
        fireEvent.click(within(stateControl()).getByRole("radio", { name: "Approved" }));
        expect(onRouteChange).toHaveBeenLastCalledWith({ scope: "myRequests", state: "approved" });
        rerenderRoute({ initialScope: "myRequests", initialState: "approved" });

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(4));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({
                scope: "myRequests",
                where: { titleContains: "budget", state: "approved" }
            })
        );
        expect(screen.getByPlaceholderText<HTMLInputElement>("Search...").value).toBe("budget");
        expect(onRouteChange).toHaveBeenCalledTimes(2);
    });

    it("writes the state a scope change falls back to", async () => {
        const onRouteChange = vi.fn<(params: ReviewListRouteParams) => void>();
        renderView({ initialScope: "myRequests", initialState: "approved", onRouteChange });
        await screen.findByText("No reviews match these filters");

        fireEvent.click(within(scopeControl()).getByRole("radio", { name: "Team pool" }));

        expect(onRouteChange).toHaveBeenLastCalledWith({ scope: "pool", state: "inReview" });
    });

    it("writes the fallback of a route pair that is empty by definition", async () => {
        const onRouteChange = vi.fn<(params: ReviewListRouteParams) => void>();
        renderView({ initialScope: "pool", initialState: "failed", onRouteChange });
        await screen.findByText("Your team pools are empty");

        expect(onRouteChange).toHaveBeenCalledWith({ scope: "pool", state: "inReview" });
    });

    it("applies a route changed from outside and keeps the search", async () => {
        const onRouteChange = vi.fn<(params: ReviewListRouteParams) => void>();
        const { listReviews, rerenderRoute } = renderView({ onRouteChange });
        await screen.findByText("Nothing assigned to you");
        fireEvent.change(screen.getByPlaceholderText("Search..."), {
            target: { value: "budget" }
        });
        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));

        rerenderRoute({ initialScope: "all", initialState: "failed" });

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(3));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({
                scope: "all",
                where: { titleContains: "budget", state: "failed" }
            })
        );
        const all = within(scopeControl()).getByRole("radio", { name: "All" });
        expect(all.getAttribute("aria-checked")).toBe("true");
        expect(onRouteChange).not.toHaveBeenCalled();
    });

    it("writes the default state to the route when Clear filters resets it", async () => {
        const onRouteChange = vi.fn<(params: ReviewListRouteParams) => void>();
        renderView({
            initialScope: "myRequests",
            initialState: "rejected",
            onRouteChange,
            results: [page([]), page([])]
        });
        await screen.findByText("No reviews match these filters");

        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

        expect(onRouteChange).toHaveBeenLastCalledWith({ scope: "myRequests", state: "all" });
    });

    it("shows the scope's empty text without Clear filters when nothing is filtered", async () => {
        renderView({ initialScope: "myRequests", initialState: "inReview" });
        expect(await screen.findByText("You haven’t requested any reviews")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    });

    it("shows Clear filters only beside the filtered text", async () => {
        const { listReviews } = renderView({ results: [page([]), page([]), page([])] });
        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();

        fireEvent.click(within(stateControl()).getByRole("radio", { name: "All" }));
        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();

        fireEvent.change(screen.getByPlaceholderText("Search..."), {
            target: { value: "budget" }
        });
        expect(await screen.findByText("No reviews match these filters")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
    });

    it("lists a failed step with its tag, the step title as owner and a Restart menu item (QBZ-29, QBZ-79)", async () => {
        renderView({
            initialScope: "all",
            initialState: "failed",
            permissions: REASSIGN,
            results: [
                page([
                    createReviewListItem({
                        id: "f1",
                        title: "Spring campaign",
                        stepId: "step-5",
                        stepTitle: "AI tone check",
                        stepState: StepState.Failed,
                        owner: createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" }),
                        flags: { canRestart: true, canCancel: true }
                    })
                ])
            ]
        });
        await screen.findByText("Spring campaign");

        const row = within(rowOf("Spring campaign"));
        expect(row.getByText("Failed")).toBeTruthy();
        expect(row.getByText("AI tone check")).toBeTruthy();
        // The owner is no longer a column: it is in the hover text of the workflow status.
        expect(row.getByTitle("AI tone check · AI tone check")).toBeTruthy();
        expect(row.queryByRole("button", { name: "Restart" })).toBeNull();

        openMenu("Spring campaign");
        expect(await screen.findByRole("menuitem", { name: "Restart" })).toBeTruthy();
        expect(screen.getByRole("menuitem", { name: "Cancel review" })).toBeTruthy();
    });

    it("opens the restart dialog on the row's use cases and refetches once when it is done (R210, R266)", async () => {
        const { listReviews, fakes } = renderView({
            initialScope: "all",
            initialState: "failed",
            permissions: REASSIGN,
            results: [
                page([
                    createReviewListItem({
                        id: "f1",
                        title: "Spring campaign",
                        stepId: "step-5",
                        stepState: StepState.Failed,
                        owner: createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" }),
                        flags: { canRestart: true }
                    })
                ]),
                page([])
            ]
        });
        fakes.getReview.execute.mockResolvedValue(
            loadedReview("f1", { id: "step-5", title: "AI tone check", state: StepState.Failed })
        );
        await screen.findByText("Spring campaign");

        openMenu("Spring campaign");
        fireEvent.click(await screen.findByText("Restart"));

        expect(await screen.findByText("Restart “AI tone check”?")).toBeTruthy();
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "f1"
        });

        fireEvent.click(lastButton("Restart"));

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(fakes.restartReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "f1",
            stepId: "step-5"
        });
        await waitFor(() => expect(screen.queryByText("Restart “AI tone check”?")).toBeNull());
    });

    it("offers no Restart on a row whose flags do not allow it (D34)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "p1",
                        title: "Plain review",
                        flags: { canStart: true }
                    })
                ])
            ]
        });
        await screen.findByText("Plain review");

        openMenu("Plain review");
        await screen.findByRole("menuitem", { name: "Open content" });
        expect(screen.queryByRole("menuitem", { name: "Restart" })).toBeNull();
    });

    it("shows the Content model column and filter only when the app asks for them (D113)", async () => {
        const first = renderView({
            showContentType: true,
            contentTypeFilter: {
                options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
            },
            results: [page([createReviewListItem({ id: "r1", title: "With type" })])]
        });
        await screen.findByText("With type");
        expect(screen.getByText("Content model")).toBeTruthy();
        expect(screen.getAllByRole("button", { name: "Filter" })).toHaveLength(1);
        expect(first.listReviews.execute).toHaveBeenCalledTimes(1);
    });

    it("orders the columns as in the design, with a one-line Content model cell", async () => {
        renderView({
            showContentType: true,
            contentTypeFilter: {
                options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
            },
            results: [page([createReviewListItem({ id: "r1", title: "Ordered" })])]
        });
        await screen.findByText("Ordered");

        const headers = screen.getAllByRole("columnheader").map(header => header.textContent ?? "");
        const positions = ["Name", "Content model", "Requested by", "Modified", "Workflow"].map(
            name => headers.findIndex(text => text.startsWith(name))
        );
        expect(positions.every(position => position >= 0)).toBe(true);
        expect([...positions].sort((a, b) => a - b)).toEqual(positions);
        expect(within(rowOf("Ordered")).queryByText("Headless CMS")).toBeNull();
    });

    it("has neither Content model column nor filter without them (Website Builder)", async () => {
        renderView({
            showContentType: false,
            contentTypeFilter: null,
            results: [page([createReviewListItem({ id: "r1", title: "No type" })])]
        });
        await screen.findByText("No type");

        expect(screen.queryByText("Content model")).toBeNull();
        expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
    });

    it("has no separate review state or step state select on Requested by me", async () => {
        renderView({ initialScope: "myRequests", showContentType: false });
        await screen.findByText("You haven’t requested any reviews");
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
        expect(screen.queryByText("Any review state")).toBeNull();
        expect(screen.queryByText("Any step state")).toBeNull();
    });

    it("uses the initial scope, its default state and their default sort on the first request", async () => {
        const { listReviews } = renderView({ initialScope: "myRequests" });
        await screen.findByText("You haven’t requested any reviews");

        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: "myRequests",
                where: { state: "all" },
                sort: "lastChangedOn_DESC"
            })
        );
    });

    it("sorts by title from the Name header, one sort at a time (B2 design 2)", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "Sortable" })]),
                page([createReviewListItem({ id: "r1", title: "Sortable" })]),
                page([createReviewListItem({ id: "r1", title: "Sortable" })])
            ]
        });
        await screen.findByText("Sortable");
        expect(isSortedBy("Modified")).toBe(true);
        expect(isSortedBy("Name")).toBe(false);

        clickHeader("Name");

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "title_ASC" })
        );
        await waitFor(() => expect(isSortedBy("Name")).toBe(true));
        expect(isSortedBy("Modified")).toBe(false);

        clickHeader("Name");

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(3));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "title_DESC" })
        );
        expect(isSortedBy("Name")).toBe(true);
    });

    it("toggles the sort from the Modified header", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "Sortable" })]),
                page([createReviewListItem({ id: "r1", title: "Sortable" })]),
                page([createReviewListItem({ id: "r1", title: "Sortable" })])
            ]
        });
        await screen.findByText("Sortable");

        clickHeader("Modified");

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "lastChangedOn_DESC" })
        );

        // Never unsorted: a third click goes back to ascending.
        clickHeader("Modified");

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(3));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "lastChangedOn_ASC" })
        );
        expect(isSortedBy("Modified")).toBe(true);
    });

    it("does not sort from the other headers", async () => {
        const { listReviews } = renderView({
            results: [page([createReviewListItem({ id: "r1", title: "Sortable" })])]
        });
        await screen.findByText("Sortable");

        clickHeader("Requested by");
        clickHeader("Workflow");

        expect(listReviews.execute).toHaveBeenCalledTimes(1);
    });

    it("hides and shows columns from the table settings, but never Name", async () => {
        renderView({
            results: [page([createReviewListItem({ id: "r1", title: "Configurable" })])]
        });
        await screen.findByText("Configurable");
        expect(columnHeader("Requested by")).toBeTruthy();

        const headers = screen.getAllByRole("columnheader");
        const settings = within(headers[headers.length - 1]).getByRole("button");
        fireEvent.keyDown(settings, { key: "Enter" });

        const menu = await screen.findByRole("menu");
        expect(within(menu).queryByText("Name")).toBeNull();
        expect(within(menu).getByText("Content model")).toBeTruthy();
        expect(within(menu).getByText("Workflow")).toBeTruthy();
        expect(within(menu).getByText("Modified")).toBeTruthy();

        fireEvent.click(within(menu).getByRole("checkbox", { name: "Requested by" }));
        // The open menu hides the rest of the page from roles: close it before reading the headers.
        fireEvent.keyDown(menu, { key: "Escape" });
        await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

        expect(screen.queryByRole("columnheader", { name: /^Requested by/ })).toBeNull();
        expect(columnHeader("Name")).toBeTruthy();
        expect(columnHeader("Workflow")).toBeTruthy();
    });

    it("renders the step state label of a row", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Rejected one",
                        state: ReviewState.Rejected
                    })
                ])
            ]
        });

        await screen.findByText("Rejected one");

        expect(within(rowOf("Rejected one")).getByText("Awaiting")).toBeTruthy();
    });
});

describe("ReviewListView states", () => {
    it("renders a skeleton of 6 rows with 4 bars each while loading", () => {
        renderView({ loading: true });

        const rows = screen.getAllByTestId("review-list-skeleton-row");
        expect(rows).toHaveLength(6);
        rows.forEach(row => {
            expect(row.children).toHaveLength(4);
        });
    });

    it("shows the illustration in the failed state and a refresh icon on Try again", async () => {
        renderView({ results: [new Error("network")] });

        const title = await screen.findByText("Could not load reviews");
        const state = title.parentElement?.parentElement as HTMLElement;
        expect(state.querySelector("svg[aria-hidden]")).not.toBeNull();
        expect(
            screen.getByRole("button", { name: "Try again" }).querySelector("svg")
        ).not.toBeNull();
    });

    it("shows the illustration in the empty state", async () => {
        renderView();

        const title = await screen.findByText("Nothing assigned to you");
        const state = title.parentElement?.parentElement as HTMLElement;
        expect(state.querySelector("svg[aria-hidden]")).not.toBeNull();
    });
});

describe("ReviewListView content type icon", () => {
    it("renders the binding icon before the title", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r-icon",
                        title: "Iconic review",
                        namespace: "cms.article",
                        modelId: "article"
                    })
                ])
            ]
        });

        await screen.findByText("Iconic review");

        const cell = rowOf("Iconic review").querySelector("td") as HTMLElement;
        const icon = within(cell).getByTestId("type-icon-article");
        const link = within(cell).getByText("Iconic review");
        expect(icon.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
