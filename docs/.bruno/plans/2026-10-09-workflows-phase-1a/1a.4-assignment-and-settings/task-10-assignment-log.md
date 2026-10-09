### Task 10: Assignment log model and repository

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Create: `packages/api-workflows/src/domain/assignment/types.ts`
- Create: `packages/api-workflows/src/domain/assignment/errors.ts`
- Create: `packages/api-workflows/src/domain/assignment/assignment.model.ts`
- Create: `packages/api-workflows/src/domain/assignment/abstractions/AssignmentModelProvider.ts`
- Create: `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/AssignmentModelProvider.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/feature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`

**Interfaces:**
- Consumes: `Actor` (Task 4), `toIsoString`, `ActorEntryMapper` / `ActorEntryValues` (Task 6), CMS `CreateEntryUseCase`, `ListLatestEntriesUseCase`, `GetModelUseCase`, `ModelFactory`, `CmsEntryMeta`.
- Produces:
  - `ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment"`; `AssignmentModel`.
  - `AssignmentRecordValues { reviewId; workflowId; stepId; userId: string | null; assignedOn: string; source: string; by: Actor | null; reason: string | null }`, `AssignmentRecord extends AssignmentRecordValues { id: string }`.
  - `AssignmentRepository.Interface { create(values: AssignmentRecordValues): Promise<Result<AssignmentRecord, AssignmentPersistenceError>>; list(params: AssignmentRepository.ListParams): Promise<Result<AssignmentRepository.ListResult, AssignmentPersistenceError>> }`.
    - `ListParams { where: ListWhere; limit?: number; after?: string | null }`; `ListWhere { reviewId?; workflowId?; stepId?; userId?; userId_in?: string[] }` (filters combine with AND; phase 2 deletes a review's records by `reviewId`, phase 4 reads "the latest record per candidate" by `userId_in` (D20) and a step's records by `reviewId` + `stepId` (D127)).
    - `ListResult { items: AssignmentRecord[]; meta: CmsEntryMeta }` (the same list shape as `WorkflowRepository.list`), newest `assignedOn` first across pages: `create` stores `createdOn = assignedOn`, and the query sorts `createdOn_DESC` in storage (A8).
  - `AssignmentPersistenceError` (`Workflows/Assignment/Persistence`).
  - Nothing outside this task's test writes records in 1a (R3); phase 4 does.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, otherReviewer, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";

const createRepository = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(AssignmentRepository);
};

const record = (overrides: Partial<AssignmentRecordValues>): AssignmentRecordValues => {
    return {
        reviewId: "review-1",
        workflowId: "workflow-1",
        stepId: "legal",
        userId: null,
        assignedOn: "2026-10-09T10:00:00.000Z",
        source: "pool",
        by: null,
        reason: null,
        ...overrides
    };
};

/** review-1/legal: pool at 10:00, take over at 11:00; review-2/editorial: pick at 12:00. */
const createLog = async () => {
    const repository = await createRepository();
    const pool = expectOk(
        await repository.create(record({ reason: "No eligible candidates." }))
    );
    expectOk(
        await repository.create(
            record({
                userId: otherReviewer.id,
                assignedOn: "2026-10-09T11:00:00.000Z",
                source: "takeOver",
                by: otherReviewer
            })
        )
    );
    expectOk(
        await repository.create(
            record({
                reviewId: "review-2",
                stepId: "editorial",
                userId: reviewer.id,
                assignedOn: "2026-10-09T12:00:00.000Z",
                source: "picked"
            })
        )
    );
    return { repository, pool };
};

describe("AssignmentRepository", () => {
    it("records assignment decisions and lists a review's records newest first", async () => {
        const { repository, pool } = await createLog();

        expect(pool).toEqual({
            id: expect.any(String),
            reviewId: "review-1",
            workflowId: "workflow-1",
            stepId: "legal",
            userId: null,
            assignedOn: "2026-10-09T10:00:00.000Z",
            source: "pool",
            by: null,
            reason: "No eligible candidates."
        });

        const byReview = expectOk(await repository.list({ where: { reviewId: "review-1" } }));
        expect(byReview.items.map(item => item.source)).toEqual(["takeOver", "pool"]);
        expect(byReview.items[0].by).toEqual(otherReviewer);
        expect(byReview.meta.hasMoreItems).toBe(false);
    });

    it("filters by workflow and step, and by review and step", async () => {
        const { repository } = await createLog();

        const byWorkflowStep = expectOk(
            await repository.list({ where: { workflowId: "workflow-1", stepId: "editorial" } })
        );
        const byReviewStep = expectOk(
            await repository.list({ where: { reviewId: "review-1", stepId: "legal" } })
        );

        expect(byWorkflowStep.items.map(item => item.userId)).toEqual([reviewer.id]);
        expect(byReviewStep.items.map(item => item.source)).toEqual(["takeOver", "pool"]);
    });

    it("filters by one user or a set of users, newest first", async () => {
        const { repository } = await createLog();

        const byUser = expectOk(await repository.list({ where: { userId: reviewer.id } }));
        const byUsers = expectOk(
            await repository.list({ where: { userId_in: [reviewer.id, otherReviewer.id] } })
        );

        expect(byUser.items.map(item => item.source)).toEqual(["picked"]);
        expect(byUsers.items.map(item => item.userId)).toEqual([reviewer.id, otherReviewer.id]);
    });

    it("pages past one page with a cursor", async () => {
        const repository = await createRepository();
        for (const hour of ["10", "11", "12"]) {
            expectOk(
                await repository.create(
                    record({ reviewId: "review-3", assignedOn: `2026-10-09T${hour}:00:00.000Z` })
                )
            );
        }

        const first = expectOk(
            await repository.list({ where: { reviewId: "review-3" }, limit: 2 })
        );
        expect(first.items.map(item => item.assignedOn)).toEqual([
            "2026-10-09T12:00:00.000Z",
            "2026-10-09T11:00:00.000Z"
        ]);
        expect(first.meta.hasMoreItems).toBe(true);

        const second = expectOk(
            await repository.list({
                where: { reviewId: "review-3" },
                limit: 2,
                after: first.meta.cursor
            })
        );
        expect(second.items.map(item => item.assignedOn)).toEqual(["2026-10-09T10:00:00.000Z"]);
        expect(second.meta.hasMoreItems).toBe(false);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/assignment/abstractions/AssignmentRepository.js`.

- [ ] **Step 3: Add the assignment domain**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment";
export const WORKFLOWS_PERMISSION = "workflows";
```

Create `packages/api-workflows/src/domain/assignment/types.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    /** `null` for a pool fall-through. */
    userId: string | null;
    assignedOn: string;
    /** Rule id, "strategy", "picked", "reassign", "pool", "poolStart" or "takeOver". */
    source: string;
    /** Who acted, for reassign and take over. */
    by: Actor | null;
    /** For skips and fall-through, e.g. "pick excluded". */
    reason: string | null;
}

export interface AssignmentRecord extends AssignmentRecordValues {
    id: string;
}
```

Create `packages/api-workflows/src/domain/assignment/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";

export class AssignmentPersistenceError extends BaseError {
    override readonly code = "Workflows/Assignment/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}
```

Create `packages/api-workflows/src/domain/assignment/assignment.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { ASSIGNMENT_MODEL_ID } from "~/constants.js";

/** Private model for the assignment log (spec 4.3). Deleted with its review (phase 2). */
class AssignmentModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: ASSIGNMENT_MODEL_ID,
                    name: "Workflow Assignment"
                })
                .fields(fields => ({
                    reviewId: fields.text().label("Review ID"),
                    workflowId: fields.text().label("Workflow ID"),
                    stepId: fields.text().label("Step ID"),
                    userId: fields.text().label("User ID"),
                    assignedOn: fields.datetime().label("Assigned on").withoutTimezone(),
                    source: fields.text().label("Source"),
                    by: fields
                        .object()
                        .label("By")
                        .fields(byFields => ({
                            type: byFields.text().label("Type"),
                            id: byFields.text().label("ID"),
                            displayName: byFields.text().label("Display name"),
                            identityType: byFields.text().label("Identity type")
                        })),
                    reason: fields.longText().label("Reason")
                }))
        ];
    }
}

export const AssignmentModel = ModelFactory.createImplementation({
    implementation: AssignmentModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/assignment/abstractions/AssignmentModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IAssignmentModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowAssignment` model on demand. */
export const AssignmentModelProvider =
    createAbstraction<IAssignmentModelProvider>("AssignmentModelProvider");

export namespace AssignmentModelProvider {
    export type Interface = IAssignmentModelProvider;
}
```

Create `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord, AssignmentRecordValues } from "../types.js";
import type { AssignmentPersistenceError } from "../errors.js";

/** Filters combine with AND; omitted filters do not restrict. */
export interface AssignmentRepositoryListWhere {
    reviewId?: string;
    workflowId?: string;
    stepId?: string;
    userId?: string;
    /** Records of any of these users (phase 4: latest record per candidate, D20). */
    userId_in?: string[];
}

export interface AssignmentRepositoryListParams {
    where: AssignmentRepositoryListWhere;
    /** Page size; default 100. */
    limit?: number;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface AssignmentRepositoryListResult {
    items: AssignmentRecord[];
    meta: CmsEntryMeta;
}

export interface IAssignmentRepository {
    create(
        values: AssignmentRecordValues
    ): Promise<Result<AssignmentRecord, AssignmentPersistenceError>>;
    /** Newest `assignedOn` first, across pages. */
    list(
        params: AssignmentRepositoryListParams
    ): Promise<Result<AssignmentRepositoryListResult, AssignmentPersistenceError>>;
}

/** The assignment log (`wbyWorkflowAssignment`). */
export const AssignmentRepository =
    createAbstraction<IAssignmentRepository>("AssignmentRepository");

export namespace AssignmentRepository {
    export type Interface = IAssignmentRepository;
    export type ListParams = AssignmentRepositoryListParams;
    export type ListWhere = AssignmentRepositoryListWhere;
    export type ListResult = AssignmentRepositoryListResult;
}
```

- [ ] **Step 4: Add the mapper, provider, repository and feature**

Create `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`:

```ts
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";
import { ActorEntryMapper, type ActorEntryValues } from "~/features/shared/ActorEntryMapper.js";

export interface AssignmentEntryValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    userId: string | null;
    assignedOn: string | Date | null;
    source: string;
    by: ActorEntryValues | null;
    reason: string | null;
}

export class AssignmentEntryMapper {
    public static toValues(values: AssignmentRecordValues): AssignmentEntryValues {
        return {
            reviewId: values.reviewId,
            workflowId: values.workflowId,
            stepId: values.stepId,
            userId: values.userId,
            assignedOn: values.assignedOn,
            source: values.source,
            by: values.by ? ActorEntryMapper.toEntry(values.by) : null,
            reason: values.reason
        };
    }

    public static fromEntry(entry: CmsEntry<AssignmentEntryValues>): AssignmentRecord {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            reviewId: entry.values.reviewId,
            workflowId: entry.values.workflowId,
            stepId: entry.values.stepId,
            userId: entry.values.userId ?? null,
            assignedOn: toIsoString(entry.values.assignedOn) ?? entry.createdOn,
            source: entry.values.source,
            by: ActorEntryMapper.fromEntry(entry.values.by),
            reason: entry.values.reason ?? null
        };
    }
}
```

Create `packages/api-workflows/src/features/assignment/shared/AssignmentModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AssignmentModelProvider as Abstraction } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { ASSIGNMENT_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class AssignmentModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(ASSIGNMENT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const AssignmentModelProvider = Abstraction.createImplementation({
    implementation: AssignmentModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { AssignmentRepository as Abstraction } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { AssignmentEntryMapper, type AssignmentEntryValues } from "./AssignmentEntryMapper.js";

const DEFAULT_LIMIT = 100;

class AssignmentRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: AssignmentModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async create(
        values: AssignmentRecordValues
    ): Promise<Result<AssignmentRecord, AssignmentPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<AssignmentEntryValues>(model, {
            // `createdOn = assignedOn`, so the storage sort on `createdOn` is the `assignedOn`
            // order across pages (A8).
            createdOn: values.assignedOn,
            values: AssignmentEntryMapper.toValues(values)
        });
        if (result.isFail()) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }
        return Result.ok(AssignmentEntryMapper.fromEntry(result.value));
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, AssignmentPersistenceError>> {
        const model = await this.modelProvider.get();
        const { where } = params;
        const values: CmsEntryListWhereValues = {};
        if (where.reviewId) {
            values.reviewId = where.reviewId;
        }
        if (where.workflowId) {
            values.workflowId = where.workflowId;
        }
        if (where.stepId) {
            values.stepId = where.stepId;
        }
        if (where.userId) {
            values.userId = where.userId;
        }
        if (where.userId_in) {
            values.userId_in = [...where.userId_in];
        }

        const result = await this.listLatestEntries.execute<AssignmentEntryValues>(model, {
            where: { values },
            sort: ["createdOn_DESC"],
            limit: params.limit ?? DEFAULT_LIMIT,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }

        return Result.ok({
            items: result.value.entries.map(entry => AssignmentEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
    }
}

export const AssignmentRepository = Abstraction.createImplementation({
    implementation: AssignmentRepositoryImpl,
    dependencies: [AssignmentModelProvider, ListLatestEntriesUseCase, CreateEntryUseCase]
});
```

Create `packages/api-workflows/src/features/assignment/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { AssignmentModelProvider } from "./AssignmentModelProvider.js";
import { AssignmentRepository } from "./AssignmentRepository.js";

export const AssignmentSharedFeature = createFeature({
    name: "Workflows/AssignmentShared",
    register(container) {
        container.register(AssignmentModelProvider);
        container.register(AssignmentRepository).inSingletonScope();
    }
});
```

- [ ] **Step 5: Register the model and repository**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { AssignmentModel } from "~/domain/assignment/assignment.model.js";
import { AssignmentSharedFeature } from "~/features/assignment/shared/feature.js";
```

add `container.register(AssignmentModel);` after `container.register(ReviewModel);`, and append after the `// Reviews` block:

```ts

        // Assignment log (written from phase 4)
        AssignmentSharedFeature.register(container);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts 2>&1 | tail -50`
Expected: PASS (4 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add the assignment log model and repository

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---

