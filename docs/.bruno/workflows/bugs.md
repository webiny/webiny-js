# Workflows: bugs to fix outside the rewrite

Bugs found during discovery that get fixed separately, before or alongside the rewrite. Bugs inside code the rewrite replaces are not listed here (see D18).

## B1. WB page folders can be deleted with pages inside

- ACO `ModelFolderBeforeDeleteHandler` checks content only for folder type `cms:<modelId>` when `getModel(modelId)` succeeds (`packages/api-aco/.../EnsureHcmsFolderIsEmptyOnDelete/ModelFolderBeforeDeleteHandler.ts:20-28`).
- WB page folders are type `wb:page` (`packages/app-website-builder/src/constants.ts:29`), which resolves modelId `"page"`. The page model is `wbyWbPage`, so the lookup fails and the check is skipped.
- No guard exists in `api-website-builder` or `api-website-builder-workflows`.
- Effect: a WB folder holding pages (but no subfolders) can be deleted. Pages keep a dangling `folderId`; workflow folder rules stop matching them.
- Fixed in Phase 0 Task 4. The existence check runs without authorization, so pages hidden by `wb.page` own scope still block the delete.
- Fix: add a `FolderBeforeDelete` handler in `api-website-builder` that blocks deleting a `wb:page` folder while it contains pages.

## B2. WorkflowsFeature registered twice

- API: `registerApiRequestStack.ts:127` and `CmsWorkflowsFeature.ts:20`. Effects: notification types listed twice, workflow models listed twice in `ModelsProvider`, SDL composed twice.
- Admin: `WorkflowsAdminApp` and `app-headless-cms-workflows/src/presentation/feature.ts:12-13` both register `WorkflowsFeature` and `WorkflowStatePresenterFeature`.
- Fix first, per D18.

## B3. DDB listUsers ignores id_in

- `packages/api-core-ddb/src/adminUsers/index.ts:109-131` queries all tenant users and never applies `where.id_in`, so it returns every user. SQL applies it in memory (`api-core-sql/src/adminUsers/index.ts:92-112`).
- Callers mostly re-find by id (`loaders.ts:45`), which hides the bug.
- Fix: apply `id_in` in the DDB implementation, together with the new `teams_in` filter (D48, D50).
- Fixed in Phase 0 Task 3.

## B4. CMS folder delete guard may report "not authorized" instead of "not empty" (to verify)

- `api-aco/src/features/folder/EnsureHcmsFolderIsEmptyOnDelete/ModelFolderBeforeDeleteHandler.ts` throws `WebinyError.from(result.error, { code: "ACO_BEFORE_FOLDER_DELETE_HCMS_HANDLER" })`.
- `DeleteFolderUseCase.ts:39-43` maps only `err.code === "Aco/Folder/NotEmpty"` to `FolderNotEmptyError`; anything else becomes `FolderNotAuthorizedError`.
- If `WebinyError.from` overrides the code, deleting a non-empty CMS folder reports "not authorized". The same pattern is in the File Manager guard (`ACO_BEFORE_FOLDER_DELETE_FILE_HANDLER`).
- The handler also filters with legacy `wbyAco_location` instead of `location`.
- Verified: not a bug (Phase 0 Task 8). `WebinyError.from` keeps `err.code` when present, so `Aco/Folder/NotEmpty` survives the wrap.
