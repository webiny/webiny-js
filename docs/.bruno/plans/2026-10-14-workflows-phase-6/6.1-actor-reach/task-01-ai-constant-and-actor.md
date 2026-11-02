### Task 1: `AI_STEP_TYPE` and `getAiActor`

Spec 5.2; D58, D107; R141 (mirror), R164. Two small, pure additions to `packages/api-workflows`; no behaviour changes yet, nothing consumes them until Tasks 3, 17 and 19:

- `domain/workflow/stepTypes.ts` gains `export const AI_STEP_TYPE = "ai"` next to `REVIEW_STEP_TYPE` and `AUTOMATION_STEP_TYPE`. The file comment "`ai` is registered by phase 6 and has no constant here" is replaced by the final comment `/** The step type ids (R131, R164). review and automation are registered by the engine; ai is registered by ai-powerups (R177). */` (no "phase 6"). The `"ai"` string literals elsewhere (`ListWorkflowStepTypesUseCase` placeholder row, `StoreWorkflowUseCase` unavailable-type message, `FAILED_STEP_LIST_TYPES`) are left alone: they are phase 5 code whose tests stay unchanged, and Task 17 and 19 switch to the constant where they touch those files.
- `domain/ai/getAiActor.ts` (new folder `domain/ai/`): pure `getAiActor(requester: Actor): Actor` returning `{ type: "ai", id: requester.id, displayName: requester.displayName }`. It is the mirror of `domain/automation/getAutomationActor.ts` (spec 5.2, D58, D107, R141): the AI step's owner, its approve and reject facts and its `fail` facts say who the AI acts for; `identityType` is omitted because an AI step is not an identity. `ActorType` already contains `"ai"` (`domain/review/types.ts`), so no type change is needed.

**Files:**
- Modify: `packages/api-workflows/src/domain/workflow/stepTypes.ts`
- Create: `packages/api-workflows/src/domain/ai/getAiActor.ts`
- Create: `packages/api-workflows/__tests__/domain/getAiActor.test.ts`

**Interfaces:**
- Consumes:
  - Existing: `Actor` (`~/domain/review/types.js`), `requester` (`~tests/__helpers/fixtures.js`; `{ type: "user", id: "user-requester", displayName: "Rita Requester", identityType: "admin" }`).
- Produces (matches the contract):
  - `AI_STEP_TYPE = "ai"` (`~/domain/workflow/stepTypes.js`). Consumed by Tasks 17 and 19.
  - `getAiActor(requester: Actor): Actor` (`~/domain/ai/getAiActor.js`). Consumed by Tasks 3 and 19.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/domain/getAiActor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getAiActor } from "~/domain/ai/getAiActor.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import {
    AI_STEP_TYPE,
    AUTOMATION_STEP_TYPE,
    REVIEW_STEP_TYPE
} from "~/domain/workflow/stepTypes.js";
import { requester } from "~tests/__helpers/fixtures.js";

describe("AI_STEP_TYPE (R164)", () => {
    it("is the stored id of the AI step type, next to the built-in ones", () => {
        expect(AI_STEP_TYPE).toBe("ai");
        expect(REVIEW_STEP_TYPE).toBe("review");
        expect(AUTOMATION_STEP_TYPE).toBe("automation");
    });
});

describe("getAiActor (R141 mirror, R164)", () => {
    it("carries the requester's id and name with the ai type", () => {
        expect(getAiActor(requester)).toEqual({
            type: "ai",
            id: requester.id,
            displayName: requester.displayName
        });
    });

    it("omits the identity type, even when the requester has one", () => {
        expect(requester.identityType).toBe("admin");
        expect(getAiActor(requester)).not.toHaveProperty("identityType");
    });

    it("does not change the requester", () => {
        const copy = structuredClone(requester);

        getAiActor(requester);

        expect(requester).toEqual(copy);
    });

    it("differs from the automation actor only by its type", () => {
        expect({ ...getAiActor(requester), type: "automation" }).toEqual(
            getAutomationActor(requester)
        );
        expect(getAiActor(requester).type).not.toBe(getAutomationActor(requester).type);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn test packages/api-workflows/__tests__/domain/getAiActor.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/getAiActor.test.ts 2>&1 | tail -50
```

Expected: FAIL on both, the suite cannot load `~/domain/ai/getAiActor.js` ("Failed to resolve import") and `AI_STEP_TYPE` is not exported.

- [ ] **Step 3: Write the implementation**

Replace the content of `packages/api-workflows/src/domain/workflow/stepTypes.ts`:

```ts
/**
 * The step type ids (R131, R164). review and automation are registered by the engine;
 * ai is registered by ai-powerups (R177).
 */
export const REVIEW_STEP_TYPE = "review";
export const AUTOMATION_STEP_TYPE = "automation";
export const AI_STEP_TYPE = "ai";
```

Create `packages/api-workflows/src/domain/ai/getAiActor.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/**
 * The actor of an AI step (spec 5.2, D58, D107, R164): the requester's id and name with the `ai`
 * type, so the step's owner, its approve and reject facts and its `fail` facts say who the AI acts
 * for. `identityType` is omitted: an AI step is not an identity (R141 mirror). Pure.
 */
export const getAiActor = (requester: Actor): Actor => {
    return {
        type: "ai",
        id: requester.id,
        displayName: requester.displayName
    };
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
yarn test packages/api-workflows/__tests__/domain/getAiActor.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/getAiActor.test.ts 2>&1 | tail -50
```

Expected: PASS on both (5 tests).

- [ ] **Step 5: Run the existing tests covering the changed code**

```bash
yarn test packages/api-workflows/__tests__/domain/getAutomationActor.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
```

Expected: all green and no type errors. Nothing else imports `stepTypes.ts` through a changed export, so these files cover it.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-workflows): add the AI step type constant and the AI actor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
