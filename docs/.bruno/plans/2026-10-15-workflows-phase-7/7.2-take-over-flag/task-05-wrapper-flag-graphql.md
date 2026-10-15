### Task 5: CMS and Website Builder wrappers and GraphQL arguments

Spec 5.1, 11; D111, D132, D136; R185, R198; Review Focus 7. Depends on Task 4 (`TakeOverReviewStepUseCase.Input.notifyPreviousOwner?`, `ReviewStepTakenOverFact.notifyPreviousOwner`). The flag reaches the engine from both app wrappers and both GraphQL mutations:

- `TakeOverCmsEntryReviewStepInput` and `TakeOverWebsiteBuilderPageReviewStepInput` gain `notifyPreviousOwner?: boolean`. Each wrapper use case passes `notifyPreviousOwner: input.notifyPreviousOwner ?? true` to the engine (the engine default is the second line of defence, R198). The guard, permission and target-access behaviour is unchanged (D132: the wrapper still checks target read access; the flag is no permission).
- GraphQL: `takeOverCmsEntryReviewStep(reviewId: ID!, stepId: ID!, notifyPreviousOwner: Boolean = true): CmsEntryReviewResponse!` and `takeOverWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!, notifyPreviousOwner: Boolean = true): WbPageReviewResponse!`. The schema default makes an omitted argument `true`; an explicit `null` is not refused (the argument is nullable) and the wrapper's `?? true` turns it into `true`, so omitted and `null` both notify, only an explicit `false` suppresses. The resolvers pass `args.notifyPreviousOwner` through (the resolver generic is the wrapper's `Input`, so `args` is typed).
- Nothing else changes: the reassign, start, approve, reject and cancel wrappers and mutations are untouched (reassign has no flag, D111); no model, key or stored field gains the flag (R185); the client dialog checkbox is the client phase.
- Tests: the flag is read from the published `stepTakenOver` event's fact (`recordedEvents` with the `RecordingEventPublisher` decorator, registered through `legacyPlugins` as the existing wrapper and cancel-for-delete tests do). Per package: wrapper omitted -> `true`, explicit `true` -> `true`, `false` -> `false`; GraphQL omitted -> `true`, explicit `true` -> `true`, `false` -> `false`, `null` -> `true`. The existing take-over tests in both packages stay green unchanged (they never pass the argument).

**Files:**
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/abstractions.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/TakeOverCmsEntryReviewStepUseCase.ts`
- Modify: `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/abstractions.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/TakeOverWebsiteBuilderPageReviewStepUseCase.ts`
- Modify: `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`
- Modify (test): `packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts`
- Modify (test): `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`
- Modify (test): `packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts`
- Modify (test): `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`
- Modify (test helper): `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts` (the `TAKE_OVER_STEP` document)

**Interfaces:**
- Consumes:
  - Task 4: `TakeOverReviewStepUseCase.Input` (`~/features/review/TakeOverReviewStep/index.js` of `@webiny/api-workflows`) with `notifyPreviousOwner?: boolean`; `ReviewStepTakenOverFact.notifyPreviousOwner: boolean` on the event `Workflows/Review/StepTakenOver`.
  - Existing test helpers, reused: CMS `createUserContext` (`~tests/__helpers/userContext.js`), `createGraphQLClient` (`~tests/__helpers/graphql.js`), `RecordingEventPublisher`, `recordedEvents` (`~tests/__helpers/RecordingEventPublisher.js`), `scriptTargetReads`, `throwOnAccessChecks`; WB `createUserContext`, `asGraphQLUser` (`~tests/__helpers/graphql.js`), the same recorder helper path, `scriptTargetReads` (`~tests/__helpers/ScriptedWbPageTargetReads.js`), `throwOnAccessChecks` (`~tests/__helpers/ThrowingWbPageAccess.js`).
- Produces (matches the contract):
  - `TakeOverCmsEntryReviewStepInput { reviewId: string; stepId: string; notifyPreviousOwner?: boolean }` and `TakeOverWebsiteBuilderPageReviewStepInput { reviewId: string; stepId: string; notifyPreviousOwner?: boolean }`.
  - GraphQL `takeOverCmsEntryReviewStep(reviewId: ID!, stepId: ID!, notifyPreviousOwner: Boolean = true)` and `takeOverWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!, notifyPreviousOwner: Boolean = true)`. No export for later tasks.

- [ ] **Step 1: Write the failing tests**

**CMS wrapper** — in `packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts` add the import (next to the other helper imports):

```ts
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
```

and append this block at the end of the file (after the last `describe`; the file already imports `Container`, `createUserContext`, `OTHER_REVIEWER`, `REVIEWER`, `CMS_READER`, `STEP_ID`, `scriptTargetReads`, `throwOnAccessChecks`, `TakeOverCmsEntryReviewStepUseCase`, `StartCmsEntryReviewStepUseCase`, `toActor`, `expectOk`):

```ts
describe("CMS take over wrapper: notifyPreviousOwner (D111, R198)", () => {
    /** One recording context as OTHER_REVIEWER, shared by the three cases below. */
    const recorder = (container: Container) => {
        container.registerDecorator(RecordingEventPublisher);
    };

    /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given flag (omitted when undefined). */
    const startThenTakeOver = async (notifyPreviousOwner?: boolean) => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        expectOk(
            await reviewer.container
                .resolve(StartCmsEntryReviewStepUseCase)
                .execute({ reviewId: review.id, stepId: STEP_ID })
        );
        recordedEvents.length = 0;
        const taker = await createUserContext({
            identity: OTHER_REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [scriptTargetReads, throwOnAccessChecks, recorder]
        });
        return taker.container.resolve(TakeOverCmsEntryReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            ...(notifyPreviousOwner === undefined ? {} : { notifyPreviousOwner })
        });
    };

    const takenOverFacts = () => {
        return recordedEvents
            .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
            .map(event => event.payload.fact);
    };

    afterEach(() => {
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("notifies the previous owner when the argument is omitted", async () => {
        const result = await startThenTakeOver();

        expect(result.isOk()).toBe(true);
        expect(takenOverFacts()).toMatchObject([
            { previousOwner: toActor(REVIEWER), notifyPreviousOwner: true }
        ]);
    });

    it("passes an explicit true to the fact", async () => {
        const result = await startThenTakeOver(true);

        expect(result.isOk()).toBe(true);
        expect(takenOverFacts()).toMatchObject([{ notifyPreviousOwner: true }]);
    });

    it("passes false to the fact and still takes the step over", async () => {
        const result = await startThenTakeOver(false);

        expect(expectOk(result).steps[0].owner).toEqual(toActor(OTHER_REVIEWER));
        expect(takenOverFacts()).toMatchObject([
            { previousOwner: toActor(REVIEWER), notifyPreviousOwner: false }
        ]);
    });
});
```

**CMS GraphQL** — in `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts` add the imports:

```ts
import type { Container } from "@webiny/di";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
```

change the `TAKE_OVER_STEP` document (the existing test omits the variable, so it keeps working and now exercises the default):

```ts
const TAKE_OVER_STEP = /* GraphQL */ `
    mutation TakeOverStep($reviewId: ID!, $stepId: ID!, $notifyPreviousOwner: Boolean) {
        cms {
            takeOverCmsEntryReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                notifyPreviousOwner: $notifyPreviousOwner
            ) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;
```

and add this nested `describe` inside `describe("CMS workflows GraphQL", ...)`, right after `starts, takes over and approves a step` (the recorder and the start-then-take-over helper are declared once per describe):

```ts
    describe("take over notifyPreviousOwner (D111)", () => {
        const recorder = (container: Container) => {
            container.registerDecorator(RecordingEventPublisher);
        };

        /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given variables. */
        const startThenTakeOver = async (variables: Record<string, unknown>) => {
            const { review } = await createScenario();
            const reviewer = createGraphQLClient({
                identity: REVIEWER,
                permissions: CMS_READER,
                legacyPlugins: [recorder]
            });
            const otherReviewer = createGraphQLClient({
                identity: OTHER_REVIEWER,
                permissions: CMS_READER,
                legacyPlugins: [recorder]
            });
            const step = { reviewId: review.id, stepId: STEP_ID };
            await run(reviewer, START_STEP, step);
            recordedEvents.length = 0;
            return run(otherReviewer, TAKE_OVER_STEP, { ...step, ...variables });
        };

        const takenOverFlags = () => {
            return recordedEvents
                .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
                .map(event => event.payload.fact.notifyPreviousOwner);
        };

        it("is true when the argument is omitted", async () => {
            const result = await startThenTakeOver({});

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is true when the argument is explicitly true", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: true });

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is false when the argument is false", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: false });

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([false]);
        });

        it("is true when the argument is explicitly null", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: null });

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });
    });
```

**WB wrapper** — in `packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts` add:

```ts
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
```

and append (the file already imports `Container`, `createUserContext`, `OTHER_REVIEWER`, `REVIEWER`, `WB_READER`, `STEP_ID`, `scriptTargetReads`, `throwOnAccessChecks`, `TakeOverWebsiteBuilderPageReviewStepUseCase`, `StartWebsiteBuilderPageReviewStepUseCase`, `toActor`, `expectOk`):

```ts
describe("WB take over wrapper: notifyPreviousOwner (D111, R198)", () => {
    /** One recording context as OTHER_REVIEWER, shared by the three cases below. */
    const recorder = (container: Container) => {
        container.registerDecorator(RecordingEventPublisher);
    };

    /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given flag (omitted when undefined). */
    const startThenTakeOver = async (notifyPreviousOwner?: boolean) => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: WB_READER });
        expectOk(
            await reviewer.container
                .resolve(StartWebsiteBuilderPageReviewStepUseCase)
                .execute({ reviewId: review.id, stepId: STEP_ID })
        );
        recordedEvents.length = 0;
        const taker = await createUserContext({
            identity: OTHER_REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [scriptTargetReads, throwOnAccessChecks, recorder]
        });
        return taker.container.resolve(TakeOverWebsiteBuilderPageReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            ...(notifyPreviousOwner === undefined ? {} : { notifyPreviousOwner })
        });
    };

    const takenOverFacts = () => {
        return recordedEvents
            .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
            .map(event => event.payload.fact);
    };

    afterEach(() => {
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("notifies the previous owner when the argument is omitted", async () => {
        const result = await startThenTakeOver();

        expect(result.isOk()).toBe(true);
        expect(takenOverFacts()).toMatchObject([
            { previousOwner: toActor(REVIEWER), notifyPreviousOwner: true }
        ]);
    });

    it("passes an explicit true to the fact", async () => {
        const result = await startThenTakeOver(true);

        expect(result.isOk()).toBe(true);
        expect(takenOverFacts()).toMatchObject([{ notifyPreviousOwner: true }]);
    });

    it("passes false to the fact and still takes the step over", async () => {
        const result = await startThenTakeOver(false);

        expect(expectOk(result).steps[0].owner).toEqual(toActor(OTHER_REVIEWER));
        expect(takenOverFacts()).toMatchObject([
            { previousOwner: toActor(REVIEWER), notifyPreviousOwner: false }
        ]);
    });
});
```

**WB GraphQL** — in `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts` change the document:

```ts
export const TAKE_OVER_STEP = /* GraphQL */ `
    mutation TakeOverStep($reviewId: ID!, $stepId: ID!, $notifyPreviousOwner: Boolean) {
        websiteBuilder {
            takeOverWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                notifyPreviousOwner: $notifyPreviousOwner
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

In `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts` add the imports:

```ts
import type { Container } from "@webiny/di";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
```

and this nested `describe` inside `describe("WB review operations through GraphQL", ...)`, right after `starts, takes over and approves a step` (recorder and helper declared once):

```ts
    describe("take over notifyPreviousOwner (D111)", () => {
        const recorder = (container: Container) => {
            container.registerDecorator(RecordingEventPublisher);
        };

        /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given variables. */
        const startThenTakeOver = async (variables: Record<string, unknown>) => {
            const { review } = await createScenario();
            const reviewer = asGraphQLUser({
                identity: REVIEWER,
                permissions: WB_READER,
                legacyPlugins: [recorder]
            });
            const otherReviewer = asGraphQLUser({
                identity: OTHER_REVIEWER,
                permissions: WB_READER,
                legacyPlugins: [recorder]
            });
            const step = { reviewId: review.id, stepId: STEP_ID };
            await reviewer.run(START_STEP, step);
            recordedEvents.length = 0;
            const body = await otherReviewer.run(TAKE_OVER_STEP, { ...step, ...variables });
            return body.data.websiteBuilder.takeOverWebsiteBuilderPageReviewStep;
        };

        const takenOverFlags = () => {
            return recordedEvents
                .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
                .map(event => event.payload.fact.notifyPreviousOwner);
        };

        it("is true when the argument is omitted", async () => {
            const result = await startThenTakeOver({});

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is true when the argument is explicitly true", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: true });

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is false when the argument is false", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: false });

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([false]);
        });

        it("is true when the argument is explicitly null", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: null });

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });
    });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL. The wrapper ignores `notifyPreviousOwner`: the `false` case finds `notifyPreviousOwner: true` on the fact (and a type error on the unknown input field when types are checked).

Run: `yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. GraphQL rejects the unknown argument `notifyPreviousOwner` on `takeOverCmsEntryReviewStep`.

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason as the CMS wrapper.

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`
Expected: FAIL. GraphQL rejects the unknown argument on `takeOverWebsiteBuilderPageReviewStep`; the existing `starts, takes over and approves a step` fails too, because the changed `TAKE_OVER_STEP` document now references an argument the schema does not have.

Run the same four with `yarn test:os` (one run at a time), for example:
`yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`
Expected: FAIL, same reasons.

- [ ] **Step 3: Implementation**

`packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/abstractions.ts`, the input:

```ts
export interface TakeOverCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    /** D111: whether the previous owner is told; omitted means true. */
    notifyPreviousOwner?: boolean;
}
```

`packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/TakeOverCmsEntryReviewStepUseCase.ts`, the engine call:

```ts
        const { viewer } = authorized.value;
        return this.engine.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds,
            notifyPreviousOwner: input.notifyPreviousOwner ?? true
        });
```

`packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`, the schema line (inside the `CmsMutation` type, replacing the existing `takeOverCmsEntryReviewStep` line; Prettier formats the long line across lines):

```graphql
        takeOverCmsEntryReviewStep(
            reviewId: ID!
            stepId: ID!
            notifyPreviousOwner: Boolean = true
        ): CmsEntryReviewResponse!
```

and the resolver:

```ts
        builder.addResolver<TakeOverCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.takeOverCmsEntryReviewStep",
            dependencies: [TakeOverCmsEntryReviewStepUseCase],
            resolver: (takeOverStep: TakeOverCmsEntryReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await takeOverStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        notifyPreviousOwner: args.notifyPreviousOwner
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

`packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/abstractions.ts`, the input:

```ts
export interface TakeOverWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    /** D111: whether the previous owner is told; omitted means true. */
    notifyPreviousOwner?: boolean;
}
```

`packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/TakeOverWebsiteBuilderPageReviewStepUseCase.ts`, the engine call:

```ts
        const { viewer } = authorized.value;
        return this.engine.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds,
            notifyPreviousOwner: input.notifyPreviousOwner ?? true
        });
```

`packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`, the schema (replacing the existing `takeOverWebsiteBuilderPageReviewStep` line):

```graphql
        takeOverWebsiteBuilderPageReviewStep(
            reviewId: ID!
            stepId: ID!
            notifyPreviousOwner: Boolean = true
        ): WbPageReviewResponse!
```

and the resolver:

```ts
        builder.addResolver<TakeOverWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.takeOverWebsiteBuilderPageReviewStep",
            dependencies: [TakeOverWebsiteBuilderPageReviewStepUseCase],
            resolver: (takeOverStep: TakeOverWebsiteBuilderPageReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await takeOverStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        notifyPreviousOwner: args.notifyPreviousOwner
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

The two reassign mutations, resolvers and wrappers, and every other mutation in both schemas stay as they are.

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same four with `yarn test:os` (one run at a time), for example:
`yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-headless-cms-workflows,api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 5: Run the existing tests covering the changed code**

These touch the take-over wrappers, the two schemas or the shared helper and must stay green unchanged (one file per command, both storages):

`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/license.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/requestAndGetReview.test.ts 2>&1 | tail -50`
Expected: PASS each.

Run the same eight with `yarn test:os` (one at a time), for example:
`yarn test:os packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS each.

- [ ] **Step 6: Commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`, `@webiny/api-headless-cms-workflows`, `@webiny/api-website-builder-workflows`) with `--no-cache`, restore `.gitleaks.toml`, then commit:

```
git commit -m "feat(api-headless-cms-workflows,api-website-builder-workflows): expose notifyPreviousOwner on the take-over wrappers and mutations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
