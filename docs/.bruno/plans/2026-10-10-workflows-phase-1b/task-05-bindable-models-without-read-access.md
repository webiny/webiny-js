### Task 5: Map model access failures to a validation error

Amended 2026-10-11 (R38): binding a workflow requires read access to the model. The original approach (read through `GetModelRepository`) does not work: `ModelsFetcher` still drops code-defined models the caller cannot access, and an access-free read or an elevated identity could fill the CMS tenant-keyed model cache with a list other callers must not see. The read stays on `GetModelUseCase`.

**Files:**
- Modify: `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsBindable.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`

**Interfaces:**
- Consumes: `GetModelUseCase` (unchanged), `ModelNotAuthorizedError` (`Cms/Model/NotAuthorized`), `WorkflowValidationError`, the package test helpers `createContextHandler` (passes `permissions` through) and `storeWorkflow`.
- Produces: `assertModelsBindable(getModel: GetModelUseCase.Interface, models: string[])` keeps its signature. `Cms/Model/NotAuthorized` becomes `WorkflowValidationError("You don't have access to the model \"<modelId>\".")`, returned by `StoreWorkflowUseCase` as a failed result instead of thrown. Other errors still propagate.

- [ ] **Step 1: Write the tests**

In `disallowUnpublishableModels.test.ts` add `EDITOR_WITHOUT_MODEL_ACCESS = [{ name: "workflows", editor: true }]`, and two tests:

1. Through `storeWorkflow` with that permission: a failed result `Workflows/Workflow/Validation` with `The model "author" does not exist.` The harness only has code-defined models, which the CMS hides from a caller without access, so they report as not found.
2. Directly on `assertModelsBindable` with a `GetModelUseCase` stub returning `Result.fail(new ModelNotAuthorizedError())`: rejects with `Workflows/Workflow/Validation` and `You don't have access to the model "author".` (the DB-model path, which the harness cannot produce).

- [ ] **Step 2: Run them**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts 2>&1 | tail -50`
Expected RED: only test 2 fails (the `ModelNotAuthorizedError` is thrown as is). Test 1 already passes, because the CMS hides the plugin model before authorization.

- [ ] **Step 3: Map the error**

In `assertModelsBindable.ts` add `const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";` and, before `throw model.error;`:

```ts
if (model.error.code === MODEL_NOT_AUTHORIZED) {
    throw new WorkflowValidationError(`You don't have access to the model "${modelId}".`);
}
```

Update the doc comment: binding requires model read access (R38); why the read is not access-free.

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: not runnable locally (A9); record "not run".

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit `fix(api-headless-cms-workflows): map model access failures to validation errors` with the two trailer lines.

---
