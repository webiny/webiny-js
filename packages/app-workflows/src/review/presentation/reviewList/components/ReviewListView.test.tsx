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
import type { ReviewListTab } from "../abstractions.js";
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
            }
        };
    }
};

const REASSIGN: IPermission[] = [{ name: "workflows", reassign: true }];

interface RenderOptions {
    results?: ListResult[];
    showContentType?: boolean;
    contentTypeFilter?: IReviewContentTypeFilter | null;
    initialTab?: ReviewListTab;
    permissions?: IPermission[];
}

const renderView = (options: RenderOptions = {}) => {
    const container = new Container();
    container.register(ReviewActivity).inSingletonScope();
    const teams: ITeam[] = [{ id: "team-1", slug: "team-1", name: "Team 1" }];
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
    (options.results ?? [page([])]).forEach(result => {
        if (result instanceof Error) {
            listReviews.execute.mockRejectedValueOnce(result);
            return;
        }
        listReviews.execute.mockResolvedValueOnce(result);
    });
    renderWithAdminUi(
        <DiContainerProvider container={container}>
            <ReviewListView
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={["cms.article", "other.app"]}
                showContentType={options.showContentType ?? true}
                contentTypeFilter={options.contentTypeFilter ?? null}
                initialTab={options.initialTab}
            />
        </DiContainerProvider>
    );

    return { activity, listReviews, fakes };
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
        expect(within(rowOf("Bound review")).getByRole("button", { name: "Start" })).toBeTruthy();

        expect(screen.queryByRole("link", { name: "Unbound review" })).toBeNull();
        const unbound = within(rowOf("Unbound review"));
        expect(unbound.queryByRole("button", { name: "Start" })).toBeNull();
        expect(unbound.queryByRole("button", { name: "More actions" })).toBeNull();
        expect(unbound.queryByRole("button", { name: "Open in new window" })).toBeNull();
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

        const start = within(rowOf("Can start"));
        expect(start.getByRole("button", { name: "Start" })).toBeTruthy();
        expect(start.queryByRole("button", { name: "Take over" })).toBeNull();

        const take = within(rowOf("Can take"));
        expect(take.getByRole("button", { name: "Take over" })).toBeTruthy();
        expect(take.queryByRole("button", { name: "Start" })).toBeNull();

        const none = within(rowOf("No actions"));
        expect(none.queryByRole("button", { name: "Start" })).toBeNull();
        expect(none.queryByRole("button", { name: "Take over" })).toBeNull();
        expect(none.getByRole("button", { name: "More actions" })).toBeTruthy();
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

        fireEvent.click(within(rowOf("Review one")).getByRole("button", { name: "Start" }));

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
        fireEvent.click(within(rowOf("Review one")).getByRole("button", { name: "Start" }));
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

        const row = within(rowOf("Review one"));
        fireEvent.click(row.getByRole("button", { name: "Open in new window" }));
        expect(open).toHaveBeenCalledWith(
            "/cms/content-entries/article?id=entry-r1%230001",
            "_blank",
            "noopener,noreferrer"
        );

        fireEvent.keyDown(row.getByRole("button", { name: "More actions" }), { key: "Enter" });
        await screen.findByRole("menuitem", { name: "Open content" });
        const names = screen.getAllByRole("menuitem").map(item => item.textContent);
        expect(names).toEqual(["Open content", "View details", "Reassign", "Cancel review"]);
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

        const more = within(rowOf("Review one")).getByRole("button", { name: "More actions" });
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
        const more = within(rowOf("Review one")).getByRole("button", { name: "More actions" });
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

    it("fades a review that left the tab and drops it on transition end", async () => {
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

        await waitFor(() => {
            expect(rowOf("Gone review").className).toContain("opacity-35");
        });
        expect(rowOf("Stays here").className).not.toContain("opacity-35");

        fireEvent.transitionEnd(rowOf("Gone review"));

        await waitFor(() => expect(screen.queryByText("Gone review")).toBeNull());
        expect(screen.getByText("Stays here")).toBeTruthy();
    });

    it("drops a leaving row when its fade is cancelled", async () => {
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
        await waitFor(() => {
            expect(rowOf("Gone review").className).toContain("opacity-35");
        });

        fireEvent.transitionCancel(rowOf("Gone review"));

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
        expect(rowOf("Will change").className).not.toContain("bg-primary-subtle");

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        await waitFor(() => {
            expect(rowOf("Will change").className).toContain("bg-primary-subtle");
        });
        expect(rowOf("Stays the same").className).not.toContain("bg-primary-subtle");
    });

    it("drops a leaving row at once when the viewer prefers reduced motion", async () => {
        vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
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

    it("ignores a transition end bubbling from a child of a leaving row", async () => {
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
        await waitFor(() => {
            expect(rowOf("Gone review").className).toContain("opacity-35");
        });

        fireEvent.transitionEnd(screen.getByText("Gone review"));

        expect(screen.getByText("Gone review")).toBeTruthy();
    });

    it("loads more by cursor and ends with 'That's everything.'", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "First page" })], "c1", true),
                page([createReviewListItem({ id: "r2", title: "Second page" })], null, false)
            ]
        });
        await screen.findByText("First page");
        expect(screen.queryByText("That's everything.")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Load more" }));

        expect(await screen.findByText("Second page")).toBeTruthy();
        expect(await screen.findByText("That's everything.")).toBeTruthy();
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

    it("shows the empty state of the tab and switches tabs", async () => {
        const { listReviews } = renderView({ results: [page([]), page([])] });

        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();

        fireEvent.mouseDown(await screen.findByRole("tab", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ list: "pool", sort: "lastChangedOn_ASC" })
        );
    });

    it("renders the four tabs in design order", async () => {
        renderView();

        const tabs = await screen.findAllByRole("tab");

        expect(tabs.map(tab => tab.textContent)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests"
        ]);
    });

    it("renders the Failed steps tab as the fifth tab for a viewer with reassign (QBZ-29)", async () => {
        renderView({ permissions: REASSIGN });

        const tabs = await screen.findAllByRole("tab");

        expect(tabs.map(tab => tab.textContent)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests",
            "Failed steps"
        ]);
    });

    it("has no Failed steps tab for a viewer with the editor permission only", async () => {
        renderView({ permissions: [{ name: "workflows", editor: true }] });

        const tabs = await screen.findAllByRole("tab");

        expect(tabs.map(tab => tab.textContent)).not.toContain("Failed steps");
        expect(tabs).toHaveLength(4);
    });

    it("opens the tab named by the route with reassign and shows its empty state (QBZ-29)", async () => {
        const { listReviews } = renderView({ initialTab: "failedSteps", permissions: REASSIGN });

        expect(await screen.findByText("No failed steps")).toBeTruthy();
        expect(
            screen.getByText("AI and automation steps that hit a technical error appear here.")
        ).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({ list: "failedSteps", sort: "lastChangedOn_ASC" })
        );
        const tab = screen.getByRole("tab", { name: "Failed steps" });
        expect(tab.getAttribute("aria-selected")).toBe("true");
    });

    it("falls back to the default tab when the route asks for Failed steps without permission", async () => {
        const { listReviews } = renderView({ initialTab: "failedSteps" });

        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledTimes(1);
        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({ list: "assignedToMe" })
        );
        expect(screen.queryByRole("tab", { name: "Failed steps" })).toBeNull();
    });

    it("switches to the Failed steps tab from the tab bar", async () => {
        const { listReviews } = renderView({
            permissions: REASSIGN,
            results: [page([]), page([])]
        });
        await screen.findByText("Nothing assigned to you");

        fireEvent.mouseDown(await screen.findByRole("tab", { name: "Failed steps" }));

        expect(await screen.findByText("No failed steps")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ list: "failedSteps", sort: "lastChangedOn_ASC" })
        );
    });

    it("lists a failed step with its tag, the step title as owner and an inline Restart (QBZ-29, QBZ-79)", async () => {
        renderView({
            initialTab: "failedSteps",
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
        expect(row.getAllByText("AI tone check")).toHaveLength(2);
        expect(row.getByRole("button", { name: "Restart" })).toBeTruthy();

        const more = row.getByRole("button", { name: "More actions" });
        fireEvent.keyDown(more, { key: "Enter" });
        expect(await screen.findByRole("menuitem", { name: "Cancel review" })).toBeTruthy();
        expect(screen.queryByRole("menuitem", { name: "Restart" })).toBeNull();
    });

    it("opens the restart dialog on the row's use cases and refetches once when it is done (R210, R266)", async () => {
        const { listReviews, fakes } = renderView({
            initialTab: "failedSteps",
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

        fireEvent.click(within(rowOf("Spring campaign")).getByRole("button", { name: "Restart" }));

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

        expect(within(rowOf("Plain review")).queryByRole("button", { name: "Restart" })).toBeNull();
    });

    it("shows the Content type column and filter only when the app asks for them (D113)", async () => {
        const first = renderView({
            showContentType: true,
            contentTypeFilter: {
                options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
            },
            results: [page([createReviewListItem({ id: "r1", title: "With type" })])]
        });
        await screen.findByText("With type");
        expect(screen.getByText("Content type")).toBeTruthy();
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
        expect(first.listReviews.execute).toHaveBeenCalledTimes(1);
    });

    it("has neither Content type column nor filter without them (Website Builder)", async () => {
        renderView({
            showContentType: false,
            contentTypeFilter: null,
            results: [page([createReviewListItem({ id: "r1", title: "No type" })])]
        });
        await screen.findByText("No type");

        expect(screen.queryByText("Content type")).toBeNull();
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    });

    it("shows the review state and step state filters on My requests", async () => {
        renderView({ initialTab: "myRequests", showContentType: false });
        await screen.findByText("You haven’t requested any reviews");
        expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });

    it("uses the initial tab and the tab's default sort on the first request", async () => {
        const { listReviews } = renderView({ initialTab: "myRequests" });
        await screen.findByText("You haven’t requested any reviews");

        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({ list: "myRequests", sort: "lastChangedOn_DESC" })
        );
    });

    it("toggles the sort from the Last change header", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "Sortable" })]),
                page([createReviewListItem({ id: "r1", title: "Sortable" })])
            ]
        });
        await screen.findByText("Sortable");

        fireEvent.click(screen.getByTitle("Oldest change first"));

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "lastChangedOn_DESC" })
        );
        expect(await screen.findByTitle("Newest change first")).toBeTruthy();
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
