### Task 5: WB `cancelWebsiteBuilderPageReviewsForDelete` with an optional `revisionId`

Spec 13.4; Q4 and Q14 (`../00-answers.md`); R205, R228, R235; D134, D157. The revision delete of Task 3 is refused while that revision's review is in progress (Task 4). The warning's Confirm (Task 36) must cancel **only that revision's** review and then repeat the delete, as the CMS does with `cancelCmsEntryReviewsForDelete(revisionId)`. Today the WB cancel-for-delete takes only `pageId` and cancels every revision's review, which is right for trash and page delete but wrong for one revision.

- GraphQL: `cancelWebsiteBuilderPageReviewsForDelete(pageId: ID!, revisionId: ID, action: WorkflowsReviewsForDeleteAction!)`. Description: "Cancels every in-progress review of the page, or of one revision when `revisionId` is given, before a trash or delete (D134)."
- A given `revisionId` must be well formed (`isValidRevisionId`, R107); a malformed one is `Workflows/Review/Validation` "The revision id is not valid.", as in the CMS resolver. `null` and absent mean "every revision".
- Wrapper input gains `targetRevisionId?: string | null`. When given, the in-progress filter keeps only that revision's reviews, and the engine call passes `targetRevisionId: input.targetRevisionId ?? null` (the engine `CancelTargetReviewsUseCase` already supports it). Omitted behaves exactly as today. A revision with no review in progress answers `ok([])` before any page read, like a page with none.
- The access rules do not change: delete access to any page first (R86), then the page-level check on one of the matching reviews' revisions.

**Files:**
- Modify: `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/abstractions.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/CancelWebsiteBuilderPageReviewsForDeleteUseCase.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts` (the `CANCEL_REVIEWS_FOR_DELETE` document)
- Modify: `packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`

**Interfaces:**
- Consumes (existing): `CancelTargetReviewsUseCase` and its `targetRevisionId` input (`packages/api-workflows/src/features/review/CancelTargetReviews/abstractions.ts`); the CMS wrapper's revision filter (`packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/CancelCmsEntryReviewsForDeleteUseCase.ts`, lines 67-72) and resolver (`CmsWorkflowsSchemaFactory.ts`, `CmsMutation.cancelCmsEntryReviewsForDelete`) as the model; `isValidRevisionId` (`packages/api-website-builder-workflows/src/graphql/isValidRevisionId.ts`, already imported by the schema factory), `ReviewValidationError` (already imported there).
- Produces: `cancelWebsiteBuilderPageReviewsForDelete(pageId: ID!, revisionId: ID, action: WorkflowsReviewsForDeleteAction!)` and wrapper input `targetRevisionId?: string | null` (consumed by Task 12 and Task 36).

- [ ] **Step 1: Write the failing tests**

`packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`, the shared cancel document takes the optional argument (an unused variable is not sent by the existing callers):

```ts
export const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete(
        $pageId: ID!
        $revisionId: ID
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(
                pageId: $pageId
                revisionId: $revisionId
                action: $action
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

`packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts`, add the import next to the other imports:

```ts
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
```

and add these tests inside `describe("WB cancel-for-delete wrapper (D134)", ...)`, after the last test (`reports a mismatched target by the page id, and cancels nothing`):

```ts
    describe("one revision (R235)", () => {
        /** Revision 1 and revision 2 of Page A each have a review in progress. */
        const createTwoReviewScenario = async () => {
            const { admin, page, review } = await createScenario();
            const second = expectOk(
                await admin.container
                    .resolve(CreatePageRevisionFromUseCase)
                    .execute({ id: page.id })
            );
            const secondReview = await requestPageReview(admin, second);
            return { admin, page, review, second, secondReview };
        };

        it("cancels only the given revision's review and leaves the other in progress", async () => {
            const { admin, page, review, second, secondReview } = await createTwoReviewScenario();
            const deleter = await createDeleterContext();

            const cancelled = expectOk(
                await cancelForDelete(deleter, {
                    targetId: page.entryId,
                    targetRevisionId: second.id,
                    action: "delete"
                })
            );

            expect(cancelled.map(item => item.id)).toEqual([secondReview.id]);
            const facts = recordedEvents
                .filter(event => event.eventType === "Workflows/Review/Cancelled")
                .map(event => event.payload.fact);
            expect(facts).toEqual([
                expect.objectContaining({ actor: toActor(WRITER), reason: "content deleted" })
            ]);
            const getReview = admin.container.resolve(GetReviewUseCase);
            expect(expectOk(await getReview.execute({ id: secondReview.id })).state).toBe(
                "cancelled"
            );
            expect(expectOk(await getReview.execute({ id: review.id })).state).toBe("inProgress");
        });

        it("cancels every revision's review when the revision id is omitted, as before", async () => {
            const { admin, page, review, secondReview } = await createTwoReviewScenario();
            const deleter = await createDeleterContext();

            const cancelled = expectOk(
                await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" })
            );

            expect(cancelled.map(item => item.id).sort()).toEqual([review.id, secondReview.id].sort());
            const getReview = admin.container.resolve(GetReviewUseCase);
            expect(expectOk(await getReview.execute({ id: review.id })).state).toBe("cancelled");
            expect(expectOk(await getReview.execute({ id: secondReview.id })).state).toBe(
                "cancelled"
            );
        });

        it("cancels every revision's review when the revision id is null", async () => {
            const { page, review, secondReview } = await createTwoReviewScenario();
            const deleter = await createDeleterContext();

            const cancelled = expectOk(
                await cancelForDelete(deleter, {
                    targetId: page.entryId,
                    targetRevisionId: null,
                    action: "trash"
                })
            );

            expect(cancelled.map(item => item.id).sort()).toEqual([review.id, secondReview.id].sort());
        });

        it("answers an empty list for a revision with no review in progress, and cancels nothing", async () => {
            const { admin, page, review } = await createScenario();
            const second = expectOk(
                await admin.container
                    .resolve(CreatePageRevisionFromUseCase)
                    .execute({ id: page.id })
            );
            const deleter = await createDeleterContext();

            const cancelled = expectOk(
                await cancelForDelete(deleter, {
                    targetId: page.entryId,
                    targetRevisionId: second.id,
                    action: "delete"
                })
            );

            expect(cancelled).toEqual([]);
            const stored = expectOk(
                await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
            );
            expect(stored.state).toBe("inProgress");
        });

        it("still refuses a user who cannot delete the page, for a revision too", async () => {
            const { admin, page, review, second } = await createTwoReviewScenario();
            const writer = await createUserContext({
                identity: WRITER,
                permissions: WB_WRITER,
                legacyPlugins: [countEngineCalls]
            });

            const result = await cancelForDelete(writer, {
                targetId: page.entryId,
                targetRevisionId: second.id,
                action: "delete"
            });

            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(engineCalls).toEqual([]);
            const stored = expectOk(
                await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
            );
            expect(stored.state).toBe("inProgress");
        });
    });
```

`packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`, add these imports (`expectOk` joins the existing `import { createPage } from "~tests/__helpers/pages.js";`, which becomes `import { createPage, expectOk } from "~tests/__helpers/pages.js";`) and these tests inside `describe("WB review operations through GraphQL", ...)`, after the last test:

```ts
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
```

```ts
    it("cancels only the given revision's review when revisionId is given (R235)", async () => {
        const { admin, page, review } = await createScenario();
        const second = expectOk(
            await admin.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        const secondReview = await requestPageReview(admin, second);
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const body = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            revisionId: second.id,
            action: "delete"
        });

        const result = body.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({ id: secondReview.id, state: "cancelled" });
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("cancels every revision's review when revisionId is omitted (unchanged)", async () => {
        const { admin, page, review } = await createScenario();
        const second = expectOk(
            await admin.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        const secondReview = await requestPageReview(admin, second);
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const body = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });

        const result = body.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data.map((item: { id: string }) => item.id).sort()).toEqual(
            [review.id, secondReview.id].sort()
        );
    });

    it("returns the revision id validation error for a malformed revisionId (R107)", async () => {
        const { page } = await createScenario();
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        for (const revisionId of MALFORMED_REVISION_IDS) {
            const body = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
                pageId: page.entryId,
                revisionId,
                action: "delete"
            });

            expect(body.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete).toEqual({
                data: null,
                error: REVISION_ID_ERROR
            });
        }
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
```

Expected: FAIL. In the wrapper test the revision-scoped call cancels both reviews (`expected [ review-1, review-2 ] to deeply equal [ review-2 ]`); in the GraphQL test the schema rejects the argument (`Unknown argument "revisionId" on field "WbMutation.cancelWebsiteBuilderPageReviewsForDelete"`).

- [ ] **Step 3: Implement**

`packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/abstractions.ts`:

```ts
export interface CancelWebsiteBuilderPageReviewsForDeleteInput {
    /** The page id (all revisions). */
    targetId: string;
    /** Deleting one revision: only its review. Omitted for trash and page delete. */
    targetRevisionId?: string | null;
    /** Recorded as the cancel reason: "content trashed" or "content deleted". */
    action: ReviewActiveOnTrashAction;
}
```

and the description of the abstraction (the doc comment above `CancelWebsiteBuilderPageReviewsForDeleteUseCase`):

```ts
/**
 * The confirm path for trashing or deleting a page, or deleting one of its revisions, with a
 * review in progress (D134, R74, R235): cancels the page's in-progress reviews, or only the given
 * revision's, as the caller, who needs delete access to the page and no cancel right. The admin
 * calls it, then repeats the trash or delete.
 */
```

`packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/CancelWebsiteBuilderPageReviewsForDeleteUseCase.ts`, the filter:

```ts
        const inProgress = reviews.value.filter(review => {
            if (review.state !== "inProgress") {
                return false;
            }
            return !input.targetRevisionId || review.targetRevisionId === input.targetRevisionId;
        });
        if (inProgress.length === 0) {
            return Result.ok([]);
        }
```

and the engine call:

```ts
        return this.cancelTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? null,
            actor: actor.value,
            reason: getDeleteCancelReason(input.action)
        });
```

`packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`. Each of the three blocks below **replaces** the existing one: the args interface `CancelWebsiteBuilderPageReviewsForDeleteArgs` (about line 49), the typeDef description and field (the `"Cancels every in-progress review of the page ..."` line and the `cancelWebsiteBuilderPageReviewsForDelete(...)` field in `extend type WbMutation`, about line 186), and the whole resolver `WbMutation.cancelWebsiteBuilderPageReviewsForDelete` including its `// By page id, every revision: no revision id to validate (D134).` comment (about line 469). The args interface:

```ts
interface CancelWebsiteBuilderPageReviewsForDeleteArgs {
    pageId: string;
    revisionId?: string | null;
    action: ReviewActiveOnTrashAction;
}
```

the typeDef:

```graphql
        "Cancels every in-progress review of the page, or of one revision when `revisionId` is given, before a trash or delete (D134)."
        cancelWebsiteBuilderPageReviewsForDelete(
            pageId: ID!
            revisionId: ID
            action: WorkflowsReviewsForDeleteAction!
        ): WbPageReviewArrayResponse!
```

and the resolver (replacing the existing one, comment included):

```ts
        builder.addResolver<CancelWebsiteBuilderPageReviewsForDeleteArgs>({
            path: "WbMutation.cancelWebsiteBuilderPageReviewsForDelete",
            dependencies: [CancelWebsiteBuilderPageReviewsForDeleteUseCase],
            resolver: (
                cancelForDelete: CancelWebsiteBuilderPageReviewsForDeleteUseCase.Interface
            ) => {
                return async ({ args }) => {
                    // A given revision id must be well formed (R107).
                    if (
                        args.revisionId !== null &&
                        args.revisionId !== undefined &&
                        !isValidRevisionId(args.revisionId)
                    ) {
                        return new ErrorResponse(
                            new ReviewValidationError("The revision id is not valid.")
                        );
                    }
                    const result = await cancelForDelete.execute({
                        targetId: args.pageId,
                        targetRevisionId: args.revisionId,
                        action: args.action
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

- [ ] **Step 4: Run the new tests on both storages, expect pass**

Run one command at a time:

```bash
yarn test packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors. When Task 4 exists, also run `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts` and `yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts` (the latter uses the page-wide cancel and stays green with the new optional argument); Task 5 itself does not depend on Task 4.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-website-builder-workflows): cancel the reviews of one page revision before a delete" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

## Contract notes

- **Unverified code.** Written as a mirror of the working CMS wrapper and resolver and **not run** when this plan was written. The implementer runs the tests in Steps 2 and 4. Task 5 is independent of Tasks 3 and 4: its own tests create revisions with `CreatePageRevisionFromUseCase`, which exists today; Tasks 3 and 4 are needed only for the existing-test regression run in Step 5.
