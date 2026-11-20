import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import type { ReviewListItemOverrides } from "~/review/testing/createReviewListItem.js";
import type { IReviewRowBinding } from "./abstractions.js";
import { formatLastChange } from "./formatLastChange.js";
import { getDefaultReviewListSort } from "./getDefaultReviewListSort.js";
import { getListOwnerLabel } from "./getListOwnerLabel.js";
import { getListReviewStateLabel } from "./getListReviewStateLabel.js";
import { getListRowActions } from "./getListRowActions.js";
import { getDefaultReviewListState } from "./getDefaultReviewListState.js";
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import type { ReviewListEmptyParams } from "./getReviewListEmpty.js";
import { getReviewListStates } from "./getReviewListStates.js";
import { getDisabledReviewListStateReason } from "./getDisabledReviewListStateReason.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { parseReviewListScope } from "./parseReviewListScope.js";
import { parseReviewListState } from "./parseReviewListState.js";
import { resolveRowBinding } from "./resolveRowBinding.js";
import { REVIEW_LIST_SCOPES } from "./reviewListScopes.js";
import { REVIEW_LIST_STATES } from "./reviewListStates.js";
import { toggleReviewListSort } from "./toggleReviewListSort.js";
import { toReviewListTableSorting } from "./toReviewListTableSorting.js";
import { getClickedReviewListSortField } from "./getClickedReviewListSortField.js";
import { isEmptyReviewListFilter } from "~/review/domain/isEmptyReviewListFilter.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";

const row = (overrides: ReviewListItemOverrides = {}) => {
    return toReviewListRow(createReviewListItem(overrides));
};

describe("review list pure functions", () => {
    it("sorts waiting work oldest first and everything else newest first (QBZ-69, B2 design 1)", () => {
        const scopes: ReviewListScope[] = [
            "assignedToMe",
            "pool",
            "teamInReview",
            "myRequests",
            "all"
        ];
        const states: ReviewListState[] = ["all", "inReview", "failed", "approved", "rejected"];
        for (const scope of scopes) {
            for (const state of states) {
                const oldestFirst =
                    scope === "pool" ||
                    (scope !== "myRequests" && (state === "inReview" || state === "failed"));
                expect(getDefaultReviewListSort(scope, state)).toBe(
                    oldestFirst ? "lastChangedOn_ASC" : "lastChangedOn_DESC"
                );
            }
        }
    });

    it("flips the active sort and starts another field ascending", () => {
        expect(toggleReviewListSort("lastChangedOn_ASC", "lastChangedOn")).toBe(
            "lastChangedOn_DESC"
        );
        expect(toggleReviewListSort("lastChangedOn_DESC", "lastChangedOn")).toBe(
            "lastChangedOn_ASC"
        );
        expect(toggleReviewListSort("lastChangedOn_DESC", "title")).toBe("title_ASC");
        expect(toggleReviewListSort("title_ASC", "title")).toBe("title_DESC");
        expect(toggleReviewListSort("title_DESC", "title")).toBe("title_ASC");
        expect(toggleReviewListSort("title_DESC", "lastChangedOn")).toBe("lastChangedOn_ASC");
    });

    it("gives the table exactly one sorted column for the list's sort", () => {
        expect(toReviewListTableSorting("title_ASC")).toEqual([{ id: "title", desc: false }]);
        expect(toReviewListTableSorting("title_DESC")).toEqual([{ id: "title", desc: true }]);
        expect(toReviewListTableSorting("lastChangedOn_ASC")).toEqual([
            { id: "lastChange", desc: false }
        ]);
        expect(toReviewListTableSorting("lastChangedOn_DESC")).toEqual([
            { id: "lastChange", desc: true }
        ]);
    });

    it("reads the clicked sort field from the table's next sorting", () => {
        const byTitle = [{ id: "title", desc: false }];
        const byChange = [{ id: "lastChange", desc: true }];
        // The sorted column clicked again: its direction flips.
        expect(getClickedReviewListSortField(byTitle, [{ id: "title", desc: true }])).toBe("title");
        // Another column clicked, alone or added as a second sort.
        expect(getClickedReviewListSortField(byTitle, byChange)).toBe("lastChangedOn");
        expect(getClickedReviewListSortField(byTitle, [...byTitle, ...byChange])).toBe(
            "lastChangedOn"
        );
        // A column the list does not sort by.
        expect(getClickedReviewListSortField(byTitle, [{ id: "requesterName", desc: false }])).toBe(
            null
        );
    });

    it("knows the scope and state pairs that are empty by definition (B2 design 1)", () => {
        const empty = [
            "pool×failed",
            "pool×approved",
            "pool×rejected",
            "assignedToMe×failed",
            "teamInReview×failed"
        ];
        for (const scope of REVIEW_LIST_SCOPES.map(item => item.value)) {
            for (const state of REVIEW_LIST_STATES.map(item => item.value)) {
                expect(isEmptyReviewListFilter(scope, state)).toBe(
                    empty.includes(`${scope}×${state}`)
                );
            }
            expect(
                getReviewListStates(scope)
                    .filter(item => item.disabled)
                    .map(item => `${scope}×${item.value}`)
            ).toEqual(empty.filter(pair => pair.startsWith(`${scope}×`)));
            for (const state of getReviewListStates(scope)) {
                expect(state.disabledReason !== null).toBe(state.disabled);
            }
        }
    });

    it("explains every disabled scope and state pair (B8)", () => {
        expect(getDisabledReviewListStateReason("pool", "approved")).toBe(
            "Team pool only holds open reviews."
        );
        expect(getDisabledReviewListStateReason("pool", "rejected")).toBe(
            "Team pool only holds open reviews."
        );
        expect(getDisabledReviewListStateReason("pool", "failed")).toBe(
            "Team pool only holds steps waiting for a person, never failed ones."
        );
        expect(getDisabledReviewListStateReason("assignedToMe", "failed")).toBe(
            "Failed steps are AI or automation steps, which no person owns."
        );
        expect(getDisabledReviewListStateReason("teamInReview", "failed")).toBe(
            "Failed steps are AI or automation steps, which no person owns."
        );
        expect(getDisabledReviewListStateReason("pool", "inReview")).toBeNull();
        expect(getDisabledReviewListStateReason("myRequests", "failed")).toBeNull();
    });

    it("defaults the queues to In review and Requested by me and All to All", () => {
        expect(getDefaultReviewListState("assignedToMe")).toBe("inReview");
        expect(getDefaultReviewListState("pool")).toBe("inReview");
        expect(getDefaultReviewListState("teamInReview")).toBe("inReview");
        expect(getDefaultReviewListState("myRequests")).toBe("all");
        expect(getDefaultReviewListState("all")).toBe("all");
    });

    it("labels every review state", () => {
        expect(getListReviewStateLabel(ReviewState.InProgress)).toBe("In progress");
        expect(getListReviewStateLabel(ReviewState.Approved)).toBe("Approved");
        expect(getListReviewStateLabel(ReviewState.Rejected)).toBe("Rejected");
        expect(getListReviewStateLabel(ReviewState.Cancelled)).toBe("Cancelled");
    });

    it("shows the person for a user owner and the step title for AI and automation (QBZ-79)", () => {
        const user = createActor({ id: "u1", displayName: "Marko Babić" });
        const ai = createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" });
        const automation = createActor({
            id: "auto-1",
            displayName: "Send webhook",
            type: "automation"
        });

        expect(getListOwnerLabel(user, "Editorial check", StepState.InReview)).toBe("Marko Babić");
        expect(getListOwnerLabel(ai, "AI review", StepState.InReview)).toBe("AI review");
        expect(getListOwnerLabel(automation, "Notify web team", StepState.InReview)).toBe(
            "Notify web team"
        );
        expect(getListOwnerLabel(automation, null, StepState.InReview)).toBe("Send webhook");
    });

    it("shows Team pool for an awaiting step without an owner, nothing otherwise (README 8)", () => {
        expect(getListOwnerLabel(null, "Legal sign-off", StepState.Awaiting)).toBe("Team pool");
        expect(getListOwnerLabel(null, "Legal sign-off", StepState.Pending)).toBeNull();
        expect(getListOwnerLabel(null, null, null)).toBeNull();
    });

    it("formats the last change (README 8)", () => {
        const now = new Date(2026, 9, 16, 12, 0, 0);

        expect(formatLastChange(new Date(2026, 9, 16, 11, 59, 40).toISOString(), now)).toBe(
            "Just now"
        );
        expect(formatLastChange(new Date(2026, 9, 16, 11, 48).toISOString(), now)).toBe(
            "12 min ago"
        );
        expect(formatLastChange(new Date(2026, 9, 16, 9, 0).toISOString(), now)).toBe("3 h ago");
        expect(formatLastChange(new Date(2026, 9, 15, 9, 0).toISOString(), now)).toBe("Yesterday");
        expect(formatLastChange(new Date(2026, 9, 13, 9, 0).toISOString(), now)).toBe("3 days ago");
        expect(formatLastChange(new Date(2026, 9, 17, 9, 0).toISOString(), now)).toBe("Just now");
        expect(formatLastChange("not a date", now)).toBe("");
    });

    it("builds the list actions from the flags only, through getReviewActions (D5, D54)", () => {
        expect(getListRowActions(row())).toEqual([]);

        const actions = getListRowActions(
            row({
                stepId: "step-9",
                flags: {
                    canStart: true,
                    canTakeOver: true,
                    canReassign: true,
                    canCancel: true,
                    canApprove: true,
                    canReject: true
                }
            })
        );

        expect(actions.map(action => action.kind).sort()).toEqual([
            "cancel",
            "reassign",
            "start",
            "takeOver"
        ]);
        expect(actions.every(action => action.stepId === "step-9")).toBe(true);
        expect(actions.find(action => action.kind === "start")?.label).toBe("Start");
        expect(actions.find(action => action.kind === "cancel")?.label).toBe("Cancel review");
    });

    it("offers Restart on a failed step only with canRestart (Task 11, D34)", () => {
        expect(
            getListRowActions(row({ stepState: StepState.Failed, flags: { canCancel: true } })).map(
                action => action.kind
            )
        ).toEqual(["cancel"]);

        const actions = getListRowActions(
            row({
                stepId: "step-4",
                stepState: StepState.Failed,
                flags: { canRestart: true, canCancel: true }
            })
        );

        expect(actions.map(action => action.kind)).toEqual(["cancel", "restart"]);
        expect(actions.find(action => action.kind === "restart")).toEqual({
            kind: "restart",
            label: "Restart",
            icon: "refresh",
            stepId: "step-4",
            emphasis: "secondary",
            disabledReason: null
        });
    });

    it("has an empty state per scope, for filters and for a viewer in no team (README 8, QBZ-72, QBZ-73)", () => {
        const empty = (overrides: Partial<ReviewListEmptyParams>) => {
            return getReviewListEmpty({
                scope: "assignedToMe",
                state: "inReview",
                hasFilters: false,
                hasTeams: true,
                showContentType: true,
                appLabel: "Headless CMS",
                ...overrides
            });
        };
        const filtered = {
            title: "No reviews match these filters",
            description: "Try another title, content model or state, or clear the filters."
        };

        expect(empty({})).toEqual({
            title: "Nothing assigned to you",
            description: "Steps you own and are reviewing appear here."
        });
        expect(empty({ state: "all" }).title).toBe("Nothing assigned to you");
        expect(empty({ scope: "pool" })).toEqual({
            title: "Your team pools are empty",
            description: "Steps waiting for someone in your teams to start them appear here."
        });
        expect(empty({ scope: "teamInReview" })).toEqual({
            title: "Nobody in your teams is reviewing",
            description: "Steps that a teammate is reviewing appear here."
        });
        expect(empty({ scope: "myRequests", state: "all" })).toEqual({
            title: "You haven’t requested any reviews",
            description: "Request a review from the review bar in the content editor."
        });
        expect(empty({ scope: "myRequests" }).title).toBe("You haven’t requested any reviews");
        expect(empty({ scope: "all", state: "all" })).toEqual({
            title: "No reviews yet",
            description: "Reviews you can act on or follow appear here."
        });
        expect(empty({ scope: "pool", hasFilters: true })).toEqual(filtered);
        expect(empty({ scope: "myRequests", state: "approved" })).toEqual(filtered);
        expect(empty({ scope: "assignedToMe", state: "rejected" })).toEqual(filtered);

        const noTeam = {
            title: "You’re not in a reviewing team",
            description:
                "Ask a workflow manager to add you to a team that reviews Headless CMS content."
        };
        expect(empty({ scope: "pool", hasTeams: false })).toEqual(noTeam);
        expect(empty({ scope: "teamInReview", hasTeams: false })).toEqual(noTeam);
        expect(
            empty({ scope: "pool", hasTeams: false, appLabel: "Website Builder" }).description
        ).toBe("Ask a workflow manager to add you to a team that reviews Website Builder content.");
        expect(empty({ hasTeams: false }).title).toBe("Nothing assigned to you");
        expect(empty({ scope: "pool", hasTeams: false, hasFilters: true })).toEqual(filtered);
    });

    it("names no content model in the filtered empty state of an app without one", () => {
        expect(
            getReviewListEmpty({
                scope: "pool",
                state: "inReview",
                hasFilters: true,
                hasTeams: true,
                showContentType: false,
                appLabel: "Website Builder"
            })
        ).toEqual({
            title: "No reviews match these filters",
            description: "Try another title or state, or clear the filters."
        });
    });

    it("keeps the failed steps empty state for state Failed (QBZ-29)", () => {
        const failed = {
            title: "No failed steps",
            description: "AI and automation steps that hit a technical error appear here."
        };
        for (const scope of ["all", "myRequests"] as ReviewListScope[]) {
            expect(
                getReviewListEmpty({
                    scope,
                    state: "failed",
                    hasFilters: false,
                    hasTeams: false,
                    showContentType: true,
                    appLabel: "Headless CMS"
                })
            ).toEqual(failed);
        }
    });

    it("lists the scopes and states in design order and parses their values", () => {
        expect(REVIEW_LIST_SCOPES.map(scope => scope.label)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "Requested by me",
            "All"
        ]);
        expect(REVIEW_LIST_STATES.map(state => state.label)).toEqual([
            "All",
            "In review",
            "Failed",
            "Approved",
            "Rejected"
        ]);
        expect(parseReviewListScope("pool")).toBe("pool");
        expect(parseReviewListScope("all")).toBe("all");
        expect(parseReviewListScope("failedSteps")).toBeNull();
        expect(parseReviewListScope(undefined)).toBeNull();
        expect(parseReviewListState("failed")).toBe("failed");
        expect(parseReviewListState("awaiting")).toBeNull();
        expect(parseReviewListState(null)).toBeNull();
    });

    it("lists every scope, All last, as every scope is open to every viewer (B7)", () => {
        expect(REVIEW_LIST_SCOPES.map(scope => scope.value)).toEqual([
            "assignedToMe",
            "pool",
            "teamInReview",
            "myRequests",
            "all"
        ]);
    });

    it("detects a changed row by step, state, owner, review state and last change", () => {
        const base = row({ id: "r1" });

        expect(hasRowChanged(base, row({ id: "r1" }))).toBe(false);
        expect(hasRowChanged(base, row({ id: "r1", stepId: "step-2" }))).toBe(true);
        expect(hasRowChanged(base, row({ id: "r1", stepState: StepState.InReview }))).toBe(true);
        expect(
            hasRowChanged(
                base,
                row({ id: "r1", owner: createActor({ id: "u9", displayName: "X" }) })
            )
        ).toBe(true);
        expect(hasRowChanged(base, row({ id: "r1", state: ReviewState.Approved }))).toBe(true);
        expect(
            hasRowChanged(base, row({ id: "r1", lastChangedOn: "2026-10-17T10:00:00.000Z" }))
        ).toBe(true);
    });

    it("knows which row sorts after the last row of a refetch window", () => {
        const early = row({ id: "early", lastChangedOn: "2026-10-16T08:00:00.000Z" });
        const late = row({ id: "late", lastChangedOn: "2026-10-16T09:00:00.000Z" });

        expect(isBeyondRefetchWindow(late, early, "lastChangedOn_ASC")).toBe(true);
        expect(isBeyondRefetchWindow(early, late, "lastChangedOn_ASC")).toBe(false);
        expect(isBeyondRefetchWindow(early, late, "lastChangedOn_DESC")).toBe(true);
        expect(isBeyondRefetchWindow(late, early, "lastChangedOn_DESC")).toBe(false);
        expect(isBeyondRefetchWindow(late, null, "lastChangedOn_ASC")).toBe(true);

        const alpha = row({ id: "alpha", title: "  alpha" });
        const beta = row({ id: "beta", title: "Beta" });
        expect(isBeyondRefetchWindow(beta, alpha, "title_ASC")).toBe(true);
        expect(isBeyondRefetchWindow(alpha, beta, "title_ASC")).toBe(false);
        expect(isBeyondRefetchWindow(alpha, beta, "title_DESC")).toBe(true);
        expect(isBeyondRefetchWindow(beta, alpha, "title_DESC")).toBe(false);
        expect(isBeyondRefetchWindow(alpha, row({ id: "a2", title: "ALPHA" }), "title_ASC")).toBe(
            true
        );
    });

    it("resolves a row's binding, URL and content type label, or nothing for an unbound namespace", () => {
        const binding: IReviewRowBinding = {
            getContentUrl: ref => `/c/${ref.contentTypeId}?id=${ref.targetRevisionId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`,
            renderContentTypeIcon: () => null
        };
        const provider = {
            getBinding: (namespace: string) => (namespace === "cms.article" ? binding : null)
        };

        const bound = resolveRowBinding(
            provider,
            row({ targetRevisionId: "e1#1", modelId: "article" })
        );
        expect(bound.binding).toBe(binding);
        expect(bound.contentUrl).toBe("/c/article?id=e1#1");
        expect(bound.contentTypeLabel).toBe("Type article");

        const unbound = resolveRowBinding(provider, row({ namespace: "other.app" }));
        expect(unbound).toEqual({
            binding: null,
            contentUrl: null,
            contentTypeLabel: null,
            contentTypeIcon: null
        });

        expect(resolveRowBinding(null, row())).toEqual({
            binding: null,
            contentUrl: null,
            contentTypeLabel: null,
            contentTypeIcon: null
        });
    });
});
