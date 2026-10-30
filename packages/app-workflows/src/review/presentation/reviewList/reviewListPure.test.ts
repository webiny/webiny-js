import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import type { ReviewListItemOverrides } from "~/review/testing/createReviewListItem.js";
import type { IReviewRowBinding } from "./abstractions.js";
import { formatLastChange } from "./formatLastChange.js";
import { getDefaultReviewListSort } from "./getDefaultReviewListSort.js";
import { getListOwnerLabel } from "./getListOwnerLabel.js";
import { getListReviewStateLabel } from "./getListReviewStateLabel.js";
import { getListRowActions } from "./getListRowActions.js";
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { getVisibleReviewListTabs } from "./getVisibleReviewListTabs.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { isReviewListTabAvailable } from "./isReviewListTabAvailable.js";
import { parseReviewListTab } from "./parseReviewListTab.js";
import { resolveRowBinding } from "./resolveRowBinding.js";
import { REVIEW_LIST_TABS } from "./reviewListTabs.js";

const row = (overrides: ReviewListItemOverrides = {}) => {
    return toReviewListRow(createReviewListItem(overrides));
};

const permissions = (overrides: Partial<WorkflowsPermissionSet> = {}): WorkflowsPermissionSet => {
    return { fullAccess: false, editor: false, reassign: false, ...overrides };
};

describe("review list pure functions", () => {
    it("sorts the work queues oldest first and My requests newest first (QBZ-69)", () => {
        expect(getDefaultReviewListSort("assignedToMe")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("pool")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("teamInReview")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("failedSteps")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("myRequests")).toBe("lastChangedOn_DESC");
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
            emphasis: "primary",
            disabledReason: null
        });
    });

    it("has an empty state per tab, for filters and for a viewer in no team (README 8, QBZ-72, QBZ-73)", () => {
        expect(getReviewListEmpty("assignedToMe", false, true)).toEqual({
            title: "Nothing assigned to you",
            description: "Steps you own and are reviewing appear here."
        });
        expect(getReviewListEmpty("pool", false, true)).toEqual({
            title: "Your team pools are empty",
            description: "Steps waiting for someone in your teams to start them appear here."
        });
        expect(getReviewListEmpty("teamInReview", false, true)).toEqual({
            title: "Nobody in your teams is reviewing",
            description: "Steps that a teammate is reviewing appear here."
        });
        expect(getReviewListEmpty("myRequests", false, true)).toEqual({
            title: "You haven’t requested any reviews",
            description: "Request a review from the review bar in the content editor."
        });
        expect(getReviewListEmpty("pool", true, true)).toEqual({
            title: "No reviews match these filters",
            description: ""
        });

        const noTeam = {
            title: "You’re not in a reviewing team",
            description: "Steps appear here once you’re added to a team that reviews content."
        };
        expect(getReviewListEmpty("pool", false, false)).toEqual(noTeam);
        expect(getReviewListEmpty("teamInReview", false, false)).toEqual(noTeam);
        expect(getReviewListEmpty("assignedToMe", false, false).title).toBe(
            "Nothing assigned to you"
        );
        expect(getReviewListEmpty("myRequests", false, false).title).toBe(
            "You haven’t requested any reviews"
        );
        expect(getReviewListEmpty("pool", true, false).title).toBe(
            "No reviews match these filters"
        );
    });

    it("has the Failed steps empty state (QBZ-29) and the shared filtered state", () => {
        expect(getReviewListEmpty("failedSteps", false, true)).toEqual({
            title: "No failed steps",
            description: "AI and automation steps that hit a technical error appear here."
        });
        expect(getReviewListEmpty("failedSteps", false, false).title).toBe("No failed steps");
        expect(getReviewListEmpty("failedSteps", true, true)).toEqual({
            title: "No reviews match these filters",
            description: ""
        });
    });

    it("lists the five tabs in design order and parses a tab value", () => {
        expect(REVIEW_LIST_TABS.map(tab => tab.label)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests",
            "Failed steps"
        ]);
        expect(REVIEW_LIST_TABS[4].value).toBe("failedSteps");
        expect(parseReviewListTab("pool")).toBe("pool");
        expect(parseReviewListTab("myRequests")).toBe("myRequests");
        expect(parseReviewListTab("failedSteps")).toBe("failedSteps");
        expect(parseReviewListTab("nonsense")).toBeNull();
        expect(parseReviewListTab(undefined)).toBeNull();
    });

    it("opens Failed steps only with reassign or full access and every other tab to everyone (QBZ-29, R259)", () => {
        const none = permissions();
        const editorOnly = permissions({ editor: true });
        const reassign = permissions({ reassign: true });
        const fullAccess = permissions({ fullAccess: true, editor: true, reassign: true });

        expect(isReviewListTabAvailable("failedSteps", none)).toBe(false);
        expect(isReviewListTabAvailable("failedSteps", editorOnly)).toBe(false);
        expect(isReviewListTabAvailable("failedSteps", reassign)).toBe(true);
        expect(isReviewListTabAvailable("failedSteps", fullAccess)).toBe(true);
        expect(isReviewListTabAvailable("failedSteps", permissions({ fullAccess: true }))).toBe(
            true
        );
        expect(isReviewListTabAvailable("assignedToMe", none)).toBe(true);
        expect(isReviewListTabAvailable("pool", none)).toBe(true);
        expect(isReviewListTabAvailable("teamInReview", none)).toBe(true);
        expect(isReviewListTabAvailable("myRequests", none)).toBe(true);
    });

    it("lists four visible tabs without reassign and five with it, in design order", () => {
        const four = ["assignedToMe", "pool", "teamInReview", "myRequests"];

        expect(getVisibleReviewListTabs(permissions()).map(tab => tab.value)).toEqual(four);
        expect(
            getVisibleReviewListTabs(permissions({ editor: true })).map(tab => tab.value)
        ).toEqual(four);
        const five = getVisibleReviewListTabs(permissions({ reassign: true }));
        expect(five.map(tab => tab.value)).toEqual([...four, "failedSteps"]);
        expect(five[4]).toEqual({ value: "failedSteps", label: "Failed steps" });
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
