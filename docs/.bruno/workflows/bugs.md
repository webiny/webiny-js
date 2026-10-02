# Workflows: bugs to fix outside the rewrite

Bugs found during discovery that get fixed separately, before or alongside the rewrite. Bugs inside code the rewrite replaces are not listed here (see D18).

## B1. WB page folders can be deleted with pages inside

- ACO `ModelFolderBeforeDeleteHandler` checks content only for folder type `cms:<modelId>` when `getModel(modelId)` succeeds (`packages/api-aco/.../EnsureHcmsFolderIsEmptyOnDelete/ModelFolderBeforeDeleteHandler.ts:20-28`).
- WB page folders are type `wb:page` (`packages/app-website-builder/src/constants.ts:29`), which resolves modelId `"page"`. The page model is `wbyWbPage`, so the lookup fails and the check is skipped.
- No guard exists in `api-website-builder` or `api-website-builder-workflows`.
- Effect: a WB folder holding pages (but no subfolders) can be deleted. Pages keep a dangling `folderId`; workflow folder rules stop matching them.
- Fix: add a `FolderBeforeDelete` handler in `api-website-builder` that blocks deleting a `wb:page` folder while it contains pages.

## B2. WorkflowsFeature registered twice

- API: `registerApiRequestStack.ts:127` and `CmsWorkflowsFeature.ts:20`. Effects: notification types listed twice, workflow models listed twice in `ModelsProvider`, SDL composed twice.
- Admin: `WorkflowsAdminApp` and `app-headless-cms-workflows/src/presentation/feature.ts:12-13` both register `WorkflowsFeature` and `WorkflowStatePresenterFeature`.
- Fix first, per D18.
