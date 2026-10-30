import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { createFakeVm } from "~/testing/createFakeVm.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { getPageReadOnlyReason } from "./getPageReadOnlyReason.js";

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

interface ReasonCase {
    kind: FakeReviewKind;
    page: WbStatus;
    reason: string | null;
}

const CASES: ReasonCase[] = [
    { kind: "loading", page: "draft", reason: NOT_LOADED },
    { kind: "loading", page: "published", reason: NOT_LOADED },
    { kind: "loading", page: "unpublished", reason: NOT_LOADED },
    { kind: "failed", page: "draft", reason: NOT_LOADED },
    { kind: "failed", page: "published", reason: NOT_LOADED },
    { kind: "failed", page: "unpublished", reason: NOT_LOADED },
    { kind: "noWorkflow", page: "draft", reason: null },
    { kind: "noWorkflow", page: "published", reason: null },
    { kind: "noWorkflow", page: "unpublished", reason: null },
    { kind: "none", page: "draft", reason: null },
    { kind: "none", page: "published", reason: PUBLISHED },
    { kind: "none", page: "unpublished", reason: PUBLISHED },
    { kind: "inProgress", page: "draft", reason: null },
    { kind: "inProgress", page: "published", reason: PUBLISHED },
    { kind: "inProgress", page: "unpublished", reason: null },
    { kind: "approved", page: "draft", reason: APPROVED },
    { kind: "approved", page: "published", reason: PUBLISHED },
    { kind: "approved", page: "unpublished", reason: APPROVED },
    { kind: "rejected", page: "draft", reason: REJECTED },
    { kind: "rejected", page: "published", reason: PUBLISHED },
    { kind: "rejected", page: "unpublished", reason: REJECTED }
];

describe("getPageReadOnlyReason", () => {
    it.each(CASES)("$kind review on a $page page", ({ kind, page, reason }) => {
        const vm = createFakeVm(kind);

        expect(getPageReadOnlyReason(vm, page)).toBe(reason);
    });
});
