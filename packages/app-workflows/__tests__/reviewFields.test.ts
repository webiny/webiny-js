import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { BLOCKING_REVIEW_FIELDS } from "~/review/gateway/reviewFields.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_ASSIGNMENT_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "~/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "~/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "~/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "~/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "~/review/gateway/reviewFields.js";

const isBalanced = (selection: string): boolean => {
    let depth = 0;
    for (const char of selection) {
        if (char === "{") {
            depth++;
        }
        if (char === "}") {
            depth--;
        }
        if (depth < 0) {
            return false;
        }
    }
    return depth === 0;
};

const words = (selection: string): string[] => {
    return selection.split(/\s+/).filter(Boolean);
};

describe("reviewFields", () => {
    it("pins the system workflow selection (R213)", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
    });

    it("keeps every selection balanced", () => {
        const selections = [
            ERROR_FIELDS,
            REVIEW_ASSIGNMENT_FIELDS,
            REVIEW_FIELDS,
            REVIEW_WITH_FLAGS_FIELDS,
            REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS,
            STEP_CANDIDATE_FIELDS,
            WORKFLOW_FIELDS,
            STEP_RUN_INFO_FIELDS,
            BLOCKING_REVIEW_FIELDS
        ];

        for (const selection of selections) {
            expect(isBalanced(selection)).toBe(true);
        }
    });

    it("selects the team names with the team ids (Q7)", () => {
        expect(REVIEW_FIELDS).toContain("candidateTeamIds");
        expect(REVIEW_FIELDS).toMatch(/candidateTeams\s*\{\s*id\s+name\s*\}/);
    });

    it("selects who cancelled the review and the skipped person's name (R251, R252)", () => {
        expect(REVIEW_FIELDS).toMatch(/cancelledBy\s*\{[^}]*\bid\b[^}]*\bdisplayName\b[^}]*\}/);
        expect(words(REVIEW_ASSIGNMENT_FIELDS)).toContain("userDisplayName");
        expect(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS).toContain("userDisplayName");
        expect(REVIEW_WITH_FLAGS_FIELDS).not.toContain("userDisplayName");
    });

    it("selects the run, issue and task fields the mapper reads", () => {
        expect(REVIEW_FIELDS).toMatch(/runs\s*\{[^}]*taskId[^}]*outcome[^}]*\}/);
        expect(REVIEW_FIELDS).toMatch(/issues\s*\{[^}]*fieldPath[^}]*suggestion[^}]*\}/);
        expect(words(REVIEW_FIELDS)).toContain("taskId");
    });

    it("leaves the assignment log out of the list-safe selections", () => {
        expect(REVIEW_FIELDS).not.toContain("assignments");
        expect(REVIEW_WITH_FLAGS_FIELDS).not.toContain("assignments");
    });

    it("puts the assignment log only in the single-read selections", () => {
        expect(REVIEW_ASSIGNMENT_FIELDS).toMatch(/^\s*assignments\s*\{/);
        expect(REVIEW_ASSIGNMENT_FIELDS).toContain("kind");
        expect(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS).toContain("assignments");
        expect(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS).toMatch(/steps\s*\{\s*assignments/);
    });

    it("selects every viewer flag next to the review", () => {
        for (const flag of [
            "canStart",
            "canTakeOver",
            "canApprove",
            "canReject",
            "canCancel",
            "canReassign",
            "canRestart"
        ]) {
            expect(words(REVIEW_WITH_FLAGS_FIELDS)).toContain(flag);
        }
        expect(REVIEW_WITH_FLAGS_FIELDS).toMatch(/review\s*\{/);
        expect(REVIEW_WITH_FLAGS_FIELDS).toMatch(/flags\s*\{/);
    });

    it("selects the workflow models and the step config the mapper needs", () => {
        expect(words(WORKFLOW_FIELDS)).toContain("models");
        expect(words(WORKFLOW_FIELDS)).toContain("config");
        expect(words(WORKFLOW_FIELDS)).toContain("type");
    });

    it("selects the step candidate and error fields", () => {
        expect(words(STEP_CANDIDATE_FIELDS)).toEqual([
            "id",
            "displayName",
            "excluded",
            "excludedReason",
            "teams"
        ]);
        expect(words(ERROR_FIELDS)).toEqual(["code", "message", "data"]);
    });

    it("selects exactly the seven fields of the step run info and nothing raw (R146, R257)", () => {
        expect(words(STEP_RUN_INFO_FIELDS)).toEqual([
            "taskId",
            "status",
            "startedOn",
            "finishedOn",
            "iterations",
            "outcome",
            "reason"
        ]);
    });

    it("selects the eight fields of a blocking review (R265)", () => {
        expect(words(BLOCKING_REVIEW_FIELDS)).toEqual([
            "reviewId",
            "model",
            "targetId",
            "targetRevisionId",
            "title",
            "stepPosition",
            "stepCount",
            "stepName"
        ]);
    });
});
