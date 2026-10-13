import { describe, expect, it } from "vitest";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import { redactAssignmentRecords } from "~/domain/assignment/redactAssignmentRecords.js";

const record = (id: string, kind: AssignmentRecord["kind"]): AssignmentRecord => {
    return {
        id,
        reviewId: "review-1",
        workflowId: "workflow-1",
        stepId: "legal",
        userId: kind === "skip" ? "user-skipped" : "user-owner",
        assignedOn: "2026-10-09T10:00:00.000Z",
        source: kind === "skip" ? "rule" : "roundRobin",
        ruleId: kind === "skip" ? "rule-1" : null,
        by: null,
        reason: kind === "skip" ? "Excluded: on leave." : null,
        kind
    };
};

const RECORDS = [record("a", "outcome"), record("b", "skip"), record("c", "outcome")];

const NONE: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: false };

describe("redactAssignmentRecords (D89, D127, R96)", () => {
    it("keeps skip entries for editor and reassign and drops them for everyone else", () => {
        const asEditor = redactAssignmentRecords(RECORDS, { ...NONE, editor: true });
        const asReassigner = redactAssignmentRecords(RECORDS, { ...NONE, reassign: true });
        const asFullAccess = redactAssignmentRecords(RECORDS, {
            fullAccess: true,
            editor: true,
            reassign: true
        });
        const asReviewer = redactAssignmentRecords(RECORDS, NONE);

        expect(asEditor).toEqual(RECORDS);
        expect(asReassigner).toEqual(RECORDS);
        expect(asFullAccess).toEqual(RECORDS);
        expect(asReviewer.map(item => item.id)).toEqual(["a", "c"]);
    });

    it("does not change the input", () => {
        const input = [...RECORDS];

        const output = redactAssignmentRecords(input, NONE);

        expect(output).toHaveLength(2);
        expect(output).not.toBe(input);
        expect(input).toHaveLength(RECORDS.length);
        input.forEach((item, index) => expect(item).toBe(RECORDS[index]));
    });
});
