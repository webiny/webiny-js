# Report: Request review blocked while unsaved

## Implemented
- app-workflows: IReviewUnsavedChanges, TargetReviewInitParams.unsavedChanges, TargetReviewActionVm.disabledReason, requestBlockReason through buildTargetReviewViewModel/getReviewActions, presenter vm + openAction("request") guard, ReviewDisabledActionButton (aria-disabled, focusable, admin-ui Tooltip + sr-only aria-describedby, same pattern as DisabledPublishButton) used by ReviewBar. The details drawer and list only show flag actions (never request), so they pass null.
- app-headless-cms-workflows: CmsEntryUnsavedChanges (vm.isDirty), passed in all three decorator init sites.
- app-website-builder-workflows: WbPageUnsavedChanges (editorState.autoSaving === true), passed in PageReviewBar. The editor State is a mobx observable, so the bar follows it live with no bridge.

## TDD
RED: getReviewActions (6 fail), buildTargetReviewViewModel (2), TargetReviewPresenter (2), ReviewBar (1), CMS wiring (2), WB PageReviewBar (1) failed before implementation (missing disabledReason / unsavedChanges). The two small unsaved-changes classes' unit tests were written with their classes, so no separate RED for them.
GREEN: app-workflows/src/review 1109 passed; app-headless-cms-workflows/src 343 passed; app-website-builder-workflows/src 330 passed; yarn lint clean; format:check clean.

## Commits
- 3ca00ac812 app-workflows
- 7d824fe693 app-headless-cms-workflows
- WB commit: see git log

## Concerns
Disabled button uses aria-disabled (not the disabled attribute) so the tooltip works on hover/focus.
