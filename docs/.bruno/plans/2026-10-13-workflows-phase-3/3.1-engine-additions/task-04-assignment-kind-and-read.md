### Task 4: Assignment `kind`, `ListReviewAssignmentsUseCase`, `redactAssignmentRecords`

Spec 4.3, 8, D89, D127, R96, R106, A44. The get-review wrappers (3.3 / 3.4) show the assignment-log entries per step and hide the per-user skip entries ("requester skipped", "excluded: on leave", "cannot read the content") from viewers without `editor` or `reassign`. The record cannot tell a skip from an outcome today, so it gets a stored `kind: "outcome" | "skip"` (the model is unreleased; a record stored without it reads as `"outcome"`). Phase 4 writes the records; here they are only read and redacted, and tests seed them through `AssignmentRepository.create`.

- `ListReviewAssignmentsUseCase({ reviewId })`: every record of the review, newest first, paging the repository to the end (a repeated cursor ends the loop). Internal (D132): no checks; a failed page fails with `AssignmentPersistenceError`.
- `redactAssignmentRecords(records, permissions)`: pure; keeps every record for `editor` or `reassign` (full access sets both), else drops `kind: "skip"` records. Order is kept.
- `attachAssignmentRecords(review, records)`: pure; returns the review with `assignments` on each step (the records whose `stepId` matches, in the given order). Records of other steps or reviews are ignored. The wrappers redact first, then attach. `ReviewStepWithAssignments`, `ReviewWithAssignments` and `ReviewWithAssignmentsAndViewerFlags` are the shapes the get-review wrappers return (3.3 / 3.4).

**Files:**
- Modify: `packages/api-workflows/src/domain/assignment/types.ts`
- Modify: `packages/api-workflows/src/domain/assignment/assignment.model.ts`
- Modify: `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`
- Create: `packages/api-workflows/src/domain/assignment/redactAssignmentRecords.ts`
- Create: `packages/api-workflows/src/domain/assignment/attachAssignmentRecords.ts`
- Create: `packages/api-workflows/src/features/assignment/ListReviewAssignments/abstractions.ts`
- Create: `packages/api-workflows/src/features/assignment/ListReviewAssignments/ListReviewAssignmentsUseCase.ts`
- Create: `packages/api-workflows/src/features/assignment/ListReviewAssignments/feature.ts`
- Create: `packages/api-workflows/src/features/assignment/ListReviewAssignments/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`
- Modify: `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Test: `packages/api-workflows/__tests__/assignment/redactAssignmentRecords.test.ts`
- Test: `packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts`
- Test: `packages/api-workflows/__tests__/assignment/ListReviewAssignments.test.ts`

**Interfaces:**
- Consumes: `AssignmentRepository.create(values)`, `AssignmentRepository.list({ where: { reviewId }, limit?, after })` (newest `assignedOn` first, `meta: CmsEntryMeta`), `AssignmentPersistenceError`, `AssignmentModelProvider.get()`, `CreateEntryUseCase.execute(model, { values })`, `WorkflowsPermissionSet { fullAccess; editor; reassign }`.
- Produces (3.3 / 3.4 consume these names exactly):
  - `type AssignmentRecordKind = "outcome" | "skip"`; `AssignmentRecordValues.kind: AssignmentRecordKind` (so `AssignmentRecord.kind` too).
  - `ListReviewAssignmentsUseCase` (`features/assignment/ListReviewAssignments/index.js`): `execute(input: ListReviewAssignmentsInput): Promise<Result<AssignmentRecord[], ListReviewAssignmentsUseCase.Error>>`, `ListReviewAssignmentsInput { reviewId: string }`, error `Workflows/Assignment/Persistence`.
  - `redactAssignmentRecords(records: AssignmentRecord[], permissions: WorkflowsPermissionSet): AssignmentRecord[]` (`domain/assignment/redactAssignmentRecords.js`).
  - In `domain/assignment/types.ts`: `ReviewStepWithAssignments extends ReviewStep { assignments: AssignmentRecord[] }`, `ReviewWithAssignments extends Omit<ReviewData, "steps"> { steps: ReviewStepWithAssignments[] }`, `ReviewWithAssignmentsAndViewerFlags { review: ReviewWithAssignments; flags: ReviewViewerFlags }`.
  - `attachAssignmentRecords(review: ReviewData, records: AssignmentRecord[]): ReviewWithAssignments` (`domain/assignment/attachAssignmentRecords.js`).
  - `ListReviewAssignmentsUseCase` namespace types: `Interface`, `Input`, `Error`, `Return`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/assignment/redactAssignmentRecords.test.ts`:

```ts
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
        source: kind === "skip" ? "rule-1" : "strategy",
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

        redactAssignmentRecords(input, NONE);

        expect(input).toEqual(RECORDS);
    });
});
```

Create `packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequestedReview, toSaveData } from "~tests/__helpers/fixtures.js";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import { attachAssignmentRecords } from "~/domain/assignment/attachAssignmentRecords.js";

const record = (id: string, reviewId: string, stepId: string, hour: string): AssignmentRecord => {
    return {
        id,
        reviewId,
        workflowId: "workflow-1",
        stepId,
        userId: "user-owner",
        assignedOn: `2026-10-09T${hour}:00:00.000Z`,
        source: "strategy",
        by: null,
        reason: null,
        kind: "outcome"
    };
};

describe("attachAssignmentRecords (D127, R96)", () => {
    it("puts each record on its step, keeping the given order", () => {
        const review = toSaveData(createRequestedReview());
        const records = [
            record("c", "review-1", "legal", "12"),
            record("b", "review-1", "editorial", "11"),
            record("a", "review-1", "legal", "10")
        ];

        const result = attachAssignmentRecords(review, records);

        expect(result.steps.map(step => step.id)).toEqual(["legal", "editorial"]);
        expect(result.steps[0].assignments.map(item => item.id)).toEqual(["c", "a"]);
        expect(result.steps[1].assignments.map(item => item.id)).toEqual(["b"]);
        expect({ ...result, steps: undefined }).toEqual({ ...review, steps: undefined });
        expect(result.steps[0]).toMatchObject(review.steps[0]);
    });

    it("gives every step an empty list without records and ignores other reviews and steps", () => {
        const review = toSaveData(createRequestedReview());

        const result = attachAssignmentRecords(review, [
            record("x", "review-other", "legal", "10"),
            record("y", "review-1", "missing-step", "10")
        ]);

        expect(result.steps.map(step => step.assignments)).toEqual([[], []]);
    });

    it("does not change the review it was given", () => {
        const review = toSaveData(createRequestedReview());
        const before = structuredClone(review);

        attachAssignmentRecords(review, [record("a", "review-1", "legal", "10")]);

        expect(review).toEqual(before);
    });
});
```

Create `packages/api-workflows/__tests__/assignment/ListReviewAssignments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { ListReviewAssignmentsUseCase } from "~/features/assignment/ListReviewAssignments/index.js";

const record = (reviewId: string, hour: string): AssignmentRecordValues => {
    return {
        reviewId,
        workflowId: "workflow-1",
        stepId: "legal",
        userId: reviewer.id,
        assignedOn: `2026-10-09T${hour}:00:00.000Z`,
        source: "strategy",
        by: null,
        reason: null,
        kind: "outcome"
    };
};

interface ListFaults {
    failList: boolean;
}

/** Real records, read in pages of 2 through a wrapper that counts the list calls. */
const createAssignmentContext = async () => {
    const { context } = await createContextHandler();
    const assignments = context.container.resolve(AssignmentRepository);
    for (const hour of ["10", "11", "12", "13", "14"]) {
        expectOk(await assignments.create(record("review-1", hour)));
    }
    expectOk(await assignments.create(record("review-2", "15")));

    const faults: ListFaults = { failList: false };
    let listCalls = 0;
    // The use case gets this wrapper; the seeding above used the real repository.
    context.container.registerInstance(AssignmentRepository, {
        create: values => assignments.create(values),
        list: async params => {
            listCalls++;
            if (faults.failList) {
                return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
            }
            return assignments.list({ ...params, limit: 2 });
        },
        delete: id => assignments.delete(id)
    });

    return {
        faults,
        listCalls: () => listCalls,
        listAssignments: context.container.resolve(ListReviewAssignmentsUseCase)
    };
};

describe("ListReviewAssignmentsUseCase (R96)", () => {
    it("returns every record of the review, newest first, across pages", async () => {
        const { listAssignments, listCalls } = await createAssignmentContext();

        const records = expectOk(await listAssignments.execute({ reviewId: "review-1" }));

        expect(records.map(item => item.assignedOn)).toEqual([
            "2026-10-09T14:00:00.000Z",
            "2026-10-09T13:00:00.000Z",
            "2026-10-09T12:00:00.000Z",
            "2026-10-09T11:00:00.000Z",
            "2026-10-09T10:00:00.000Z"
        ]);
        expect(records.every(item => item.reviewId === "review-1")).toBe(true);
        expect(listCalls()).toBe(3);
    });

    it("returns an empty list for a review without records", async () => {
        const { listAssignments } = await createAssignmentContext();

        const records = expectOk(await listAssignments.execute({ reviewId: "review-none" }));

        expect(records).toEqual([]);
    });

    it("fails with the assignment persistence error when a page fails", async () => {
        const { listAssignments, faults } = await createAssignmentContext();
        faults.failList = true;

        const result = await listAssignments.execute({ reviewId: "review-1" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Assignment/Persistence");
    });
});
```

In `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`:

Add the imports:

```ts
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
```

In `record`, replace:

```ts
        by: null,
        reason: null,
        ...overrides
```

with:

```ts
        by: null,
        reason: null,
        kind: "outcome",
        ...overrides
```

In the first test's `expect(pool).toEqual({ ... })`, replace:

```ts
            by: null,
            reason: "No eligible candidates."
        });
```

with:

```ts
            by: null,
            reason: "No eligible candidates.",
            kind: "outcome"
        });
```

and add at the end of the `describe("AssignmentRepository", ...)` block:

```ts
    it("stores the kind and reads a record stored without it as an outcome (R96)", async () => {
        const { context } = await createContextHandler();
        const repository = context.container.resolve(AssignmentRepository);
        expectOk(
            await repository.create(
                record({
                    reviewId: "review-kind",
                    userId: reviewer.id,
                    source: "rule-1",
                    reason: "Excluded: on leave.",
                    kind: "skip"
                })
            )
        );
        const model = await context.container.resolve(AssignmentModelProvider).get();
        expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                createdOn: "2026-10-09T09:00:00.000Z",
                values: {
                    reviewId: "review-kind",
                    workflowId: "workflow-1",
                    stepId: "legal",
                    userId: otherReviewer.id,
                    assignedOn: "2026-10-09T09:00:00.000Z",
                    source: "strategy",
                    by: null,
                    reason: null
                }
            })
        );

        const listed = expectOk(await repository.list({ where: { reviewId: "review-kind" } }));

        expect(listed.items.map(item => [item.userId, item.kind])).toEqual([
            [reviewer.id, "skip"],
            [otherReviewer.id, "outcome"]
        ]);
    });
```

In `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`, in `record`, replace:

```ts
        source: "picked",
        by: null,
        reason: null
    };
```

with:

```ts
        source: "picked",
        by: null,
        reason: null,
        kind: "outcome"
    };
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the import:

```ts
import { ListReviewAssignmentsUseCase } from "~/features/assignment/ListReviewAssignments/index.js";
```

and after `expect(container.resolveAll(AssignmentRepository)).toHaveLength(1);` add:

```ts
        expect(container.resolveAll(ListReviewAssignmentsUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/assignment packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/assignment/redactAssignmentRecords.js`, `~/domain/assignment/attachAssignmentRecords.js` and `~/features/assignment/ListReviewAssignments/index.js`; the repository tests fail on the missing `kind` (`toEqual` without `kind: "outcome"` / `[reviewer.id, undefined]`).

- [ ] **Step 3: The kind on the record, the model and the mapper**

In `packages/api-workflows/src/domain/assignment/types.ts`, replace the first line:

```ts
import type { Actor } from "~/domain/review/types.js";
```

with:

```ts
import type {
    Actor,
    ReviewData,
    ReviewStep,
    ReviewViewerFlags
} from "~/domain/review/types.js";
```

Then replace:

```ts
/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues {
```

with:

```ts
/**
 * `outcome`: who got the step (rule, strategy, picked, pool, take over, reassign). `skip`: a
 * person passed over, with the reason (requester, excluded, cannot read); only viewers with
 * `editor` or `reassign` see these (D89, D127).
 */
export type AssignmentRecordKind = "outcome" | "skip";

/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues {
```

and replace:

```ts
    /** For skips and fall-through, e.g. "pick excluded". */
    reason: string | null;
}
```

with:

```ts
    /** For skips and fall-through, e.g. "pick excluded". */
    reason: string | null;
    kind: AssignmentRecordKind;
}
```

and append at the end of the file:

```ts

/** A review step with its assignment-log entries, newest first (D127). */
export interface ReviewStepWithAssignments extends ReviewStep {
    assignments: AssignmentRecord[];
}

/** A review as the get-review wrappers return it: each step carries its entries (R96). */
export interface ReviewWithAssignments extends Omit<ReviewData, "steps"> {
    steps: ReviewStepWithAssignments[];
}

/** The get-review wrappers' value: the review with entries and the viewer's flags (spec 5.3). */
export interface ReviewWithAssignmentsAndViewerFlags {
    review: ReviewWithAssignments;
    flags: ReviewViewerFlags;
}
```

In `packages/api-workflows/src/domain/assignment/assignment.model.ts`, replace:

```ts
                    reason: fields.longText().label("Reason")
```

with:

```ts
                    reason: fields.longText().label("Reason"),
                    kind: fields.text().label("Kind")
```

In `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`, replace:

```ts
    by: ActorEntryValues | null;
    reason: string | null;
}
```

with:

```ts
    by: ActorEntryValues | null;
    reason: string | null;
    kind: string | null;
}
```

In `toValues`, replace:

```ts
            reason: values.reason
        };
```

with:

```ts
            reason: values.reason,
            kind: values.kind
        };
```

In `fromEntry`, replace:

```ts
            reason: entry.values.reason ?? null
        };
```

with:

```ts
            reason: entry.values.reason ?? null,
            // Records stored before the field existed are outcomes (R96).
            kind: entry.values.kind === "skip" ? "skip" : "outcome"
        };
```

- [ ] **Step 4: The redaction and the attach**

Create `packages/api-workflows/src/domain/assignment/redactAssignmentRecords.ts`:

```ts
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { AssignmentRecord } from "./types.js";

/**
 * The assignment entries one viewer may see (spec 8, D89, D127, R96). Pure. `editor` and
 * `reassign` (full access sets both) see every record; everyone else sees only the outcomes,
 * because a skip names a person and why they were passed over. Order is kept.
 */
export const redactAssignmentRecords = (
    records: AssignmentRecord[],
    permissions: WorkflowsPermissionSet
): AssignmentRecord[] => {
    if (permissions.editor || permissions.reassign) {
        return [...records];
    }
    return records.filter(record => record.kind !== "skip");
};
```

Create `packages/api-workflows/src/domain/assignment/attachAssignmentRecords.ts`:

```ts
import type { ReviewData } from "~/domain/review/types.js";
import type { AssignmentRecord, ReviewWithAssignments } from "./types.js";

/**
 * The review with each step's assignment-log entries (D127, R96). Pure. Records of other reviews
 * or unknown steps are ignored; the order of `records` is kept per step (newest first when they
 * come from `ListReviewAssignmentsUseCase`). Redact before attaching.
 */
export const attachAssignmentRecords = (
    review: ReviewData,
    records: AssignmentRecord[]
): ReviewWithAssignments => {
    const own = records.filter(record => record.reviewId === review.id);
    return {
        ...review,
        steps: review.steps.map(step => ({
            ...step,
            assignments: own.filter(record => record.stepId === step.id)
        }))
    };
};
```

- [ ] **Step 5: The read use case**

Create `packages/api-workflows/src/features/assignment/ListReviewAssignments/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import type { AssignmentPersistenceError } from "~/domain/assignment/errors.js";

export interface ListReviewAssignmentsInput {
    reviewId: string;
}

export interface IListReviewAssignmentsUseCaseErrors {
    persistence: AssignmentPersistenceError;
}

type UseCaseError =
    IListReviewAssignmentsUseCaseErrors[keyof IListReviewAssignmentsUseCaseErrors];

export interface IListReviewAssignmentsUseCase {
    execute(input: ListReviewAssignmentsInput): Promise<Result<AssignmentRecord[], UseCaseError>>;
}

/**
 * Every assignment-log record of a review, newest first (spec 4.3, D127, R96). Internal (D132):
 * the get-review wrappers read it, attach the records to their steps and redact them with
 * `redactAssignmentRecords`.
 */
export const ListReviewAssignmentsUseCase = createAbstraction<IListReviewAssignmentsUseCase>(
    "ListReviewAssignmentsUseCase"
);

export namespace ListReviewAssignmentsUseCase {
    export type Interface = IListReviewAssignmentsUseCase;
    export type Input = ListReviewAssignmentsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<AssignmentRecord[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/assignment/ListReviewAssignments/ListReviewAssignmentsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import { ListReviewAssignmentsUseCase as UseCase } from "./abstractions.js";

class ListReviewAssignmentsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: AssignmentRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const records: AssignmentRecord[] = [];
        let after: string | null = null;
        do {
            const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                await this.repository.list({ where: { reviewId: input.reviewId }, after });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            records.push(...page.value.items);

            const { meta } = page.value;
            const next = meta.hasMoreItems ? meta.cursor : null;
            // A repeated cursor would loop forever; treat it as the end.
            after = next && next !== after ? next : null;
        } while (after);

        return Result.ok(records);
    }
}

export const ListReviewAssignmentsUseCase = UseCase.createImplementation({
    implementation: ListReviewAssignmentsUseCaseImpl,
    dependencies: [AssignmentRepository]
});
```

Create `packages/api-workflows/src/features/assignment/ListReviewAssignments/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListReviewAssignmentsUseCase } from "./ListReviewAssignmentsUseCase.js";

export const ListReviewAssignmentsFeature = createFeature({
    name: "Workflows/ListReviewAssignments",
    register(container) {
        container.register(ListReviewAssignmentsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/assignment/ListReviewAssignments/index.ts`:

```ts
export { ListReviewAssignmentsUseCase } from "./abstractions.js";
export type { ListReviewAssignmentsInput } from "./abstractions.js";
export type {
    AssignmentRecord,
    AssignmentRecordKind,
    ReviewStepWithAssignments,
    ReviewWithAssignments,
    ReviewWithAssignmentsAndViewerFlags
} from "~/domain/assignment/types.js";
```

- [ ] **Step 6: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import:

```ts
import { ListReviewAssignmentsFeature } from "~/features/assignment/ListReviewAssignments/feature.js";
```

and replace:

```ts
        // Assignment log (written from phase 4)
        AssignmentSharedFeature.register(container);
```

with:

```ts
        // Assignment log (written from phase 4, read by the get-review wrappers)
        AssignmentSharedFeature.register(container);
        ListReviewAssignmentsFeature.register(container);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` and `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (neither writes assignment records).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|api-headless-cms-workflows|api-website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): add the assignment record kind, the review assignment read, redaction and attach

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
