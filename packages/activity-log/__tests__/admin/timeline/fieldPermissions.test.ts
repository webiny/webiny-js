import { describe, expect, it } from "vitest";
import {
    applyFieldPermissions,
    hiddenFieldIds,
    type FieldAccessRule,
    type PermissionedField
} from "~/admin/timeline/fieldPermissions.js";
import type { TimelineRecord } from "~/admin/timeline/types.js";

/**
 * Withholding fields the reader has no access to.
 *
 * This is presentation rather than access control — the values reach the browser before any of it
 * runs — and the tests are written so they keep meaning when enforcement moves to the API, because
 * what they assert is *what withholding means*, not where it happens.
 */

const rule = (overrides: Partial<FieldAccessRule> = {}): FieldAccessRule => ({
    type: "accessControl",
    action: "hide",
    target: "identity",
    operator: "matches",
    value: "admin:someone",
    ...overrides
});

const field = (fieldId: string, overrides: Partial<PermissionedField> = {}): PermissionedField => ({
    fieldId,
    ...overrides
});

const always = () => true;
const never = () => false;

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

describe("which fields are withheld", () => {
    it("withholds a field the reader has no access to", () => {
        const fields = [field("title"), field("salary", { rules: [rule()] })];

        expect([...hiddenFieldIds(fields, always)]).toEqual(["salary"]);
    });

    it("does not withhold a read-only field", () => {
        // The editor offers two levels and they answer different questions. "Viewer (read-only)"
        // means the reader may see the value and not edit it — a summary quoting it discloses
        // nothing the entry does not already show them.
        const fields = [field("salary", { rules: [rule({ action: "disable" })] })];

        expect(hiddenFieldIds(fields, always).size).toBe(0);
    });

    it("ignores a rule that is not about access at all", () => {
        // `condition` rules drive conditional visibility from other field values. Treating one as
        // a permission would hide a field from everybody the moment its condition was false.
        const fields = [field("bonus", { rules: [rule({ type: "condition" })] })];

        expect(hiddenFieldIds(fields, always).size).toBe(0);
    });

    it("leaves the decision about the identity to the caller", () => {
        // Whether a rule applies to this reader is the CMS's judgement. A second implementation
        // here could disagree with the form standing next to the timeline.
        const fields = [field("salary", { rules: [rule()] })];

        expect(hiddenFieldIds(fields, never).size).toBe(0);
    });

    it("reaches fields nested inside an object", () => {
        const fields = [
            field("hero", { settings: { fields: [field("secret", { rules: [rule()] })] } })
        ];

        expect([...hiddenFieldIds(fields, always)]).toEqual(["secret"]);
    });

    it("reaches fields inside a dynamic zone's templates", () => {
        const fields = [
            field("blocks", {
                settings: { templates: [{ fields: [field("secret", { rules: [rule()] })] }] }
            })
        ];

        expect([...hiddenFieldIds(fields, always)]).toEqual(["secret"]);
    });
});

describe("what a withheld field does to a row", () => {
    const hidden = new Set(["salary"]);

    it("takes the summary away when the save touched one", () => {
        // One sentence about the whole save, with no way to remove a field from the middle of it.
        const [row] = applyFieldPermissions(
            [
                record({
                    changeset: [
                        { path: "title", label: "Title" },
                        { path: "salary", label: "Salary" }
                    ],
                    summary: "Changed Salary from “100” to “200”.",
                    summaryKind: "deterministic"
                })
            ],
            hidden
        );

        expect(row!.summary).toBeUndefined();
        expect(row!.summaryKind).toBeUndefined();
    });

    it("takes the pending flag with it, so nothing promises a sentence that cannot come", () => {
        const [row] = applyFieldPermissions(
            [
                record({
                    changeset: [{ path: "salary", label: "Salary" }],
                    summaryPending: true
                })
            ],
            hidden
        );

        expect(row!.summaryPending).toBeUndefined();
    });

    it("leaves a summary alone when every field it describes is visible", () => {
        const [row] = applyFieldPermissions(
            [
                record({
                    changeset: [{ path: "title", label: "Title" }],
                    summary: "Changed Title from “Old” to “New”."
                })
            ],
            hidden
        );

        expect(row!.summary).toBe("Changed Title from “Old” to “New”.");
    });

    it("removes the withheld path and keeps the ones the reader may see", () => {
        const [row] = applyFieldPermissions(
            [
                record({
                    changeset: [
                        { path: "title", label: "Title" },
                        { path: "salary", label: "Salary" }
                    ]
                })
            ],
            hidden
        );

        expect(row!.changeset.map(change => change.path)).toEqual(["title"]);
    });

    it("says the row stands for more than it lists", () => {
        // Without this the row reads as complete, and a save that touched three fields would
        // report one. A timeline that lies about how much happened is worse than one that admits
        // it is not showing everything.
        const [row] = applyFieldPermissions(
            [
                record({
                    changeset: [
                        { path: "title", label: "Title" },
                        { path: "salary", label: "Salary" }
                    ]
                })
            ],
            hidden
        );

        expect(row!.truncated).toBe(true);
        expect(row!.hiddenFieldCount).toBe(1);
    });

    it("never removes the record itself", () => {
        // Even when every field it touched is withheld. A gap in a timeline tells a reader nothing
        // happened when something did, which is the failure this feature is most careful about.
        const rows = applyFieldPermissions(
            [record({ changeset: [{ path: "salary", label: "Salary" }] })],
            hidden
        );

        expect(rows).toHaveLength(1);
        expect(rows[0]!.actor.displayName).toBe("Ada");
        expect(rows[0]!.changeset).toEqual([]);
    });

    it("withholds a nested path by the field it is nested in", () => {
        const [row] = applyFieldPermissions(
            [record({ changeset: [{ path: "hero.salary", label: "Salary" }] })],
            hidden
        );

        expect(row!.changeset).toEqual([]);
    });

    it("changes nothing at all when the reader may see everything", () => {
        const records = [record({ changeset: [{ path: "title", label: "Title" }] })];

        expect(applyFieldPermissions(records, new Set())).toBe(records);
    });
});
