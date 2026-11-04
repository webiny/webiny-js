# Request review is blocked while the editor has unsaved changes

Sven's bug (2026-10-28): v2 of an article was created, edited in the form without saving, and "Request review" was clicked. The review targeted v2 correctly, but v2 was never saved after creation (`revisionModifiedOn: null`, values equal to v1), so the AI step read v1's content. Decision: option 2 — block the request while there are unsaved changes, with a hint.

Branch: `bruno/fix/workflows-sven-feedback` (merges into #6079 later). Never push, never deploy.

## Behaviour

- CMS entry editor: while the form has unsaved edits (`ContentEntryFormPresenter` `vm.isDirty`), the Request review action is disabled and shows the reason `Save your changes before requesting a review.` Saving clears it.
- Website Builder page editor (auto-save): while the editor is auto-saving (`editor.getEditorState().read().autoSaving`), Request review is disabled with `Your changes are still saving. Try again in a moment.` It turns enabled once auto-save finishes.
- Only the `request` action is affected. The other review actions (approve, reject, …) are unchanged.
- The presenter also refuses `openAction("request", …)` while a reason is set (defence; the button is disabled anyway).
- The disabled reason is shown as the button's tooltip, using whatever admin-ui offers for a disabled button with a tooltip (read-only; never change admin-ui). Wherever the request action renders (bar, and the drawer footer if it shows request), it renders the same way.

## Design

### app-workflows
- New file `review/content/IReviewUnsavedChanges.ts`:
  ```ts
  /*
   * Why the editor cannot request a review right now: unsaved edits (CMS form) or an auto-save in
   * flight (WB page editor). Built by the apps and handed to the review presenter through its init
   * parameters. Read inside the presenter's view model, so an observable source keeps the bar live.
   */
  export interface IReviewUnsavedChanges {
      // `null` when the stored revision matches what the editor shows.
      getRequestBlockReason(): string | null;
  }
  ```
- `TargetReviewInitParams` gains `unsavedChanges: IReviewUnsavedChanges | null` (next to `contentReloader`). Update every caller and test fixture.
- `TargetReviewActionVm` gains `disabledReason: string | null` (null for every action except a blocked request).
- `buildTargetReviewViewModel` input gains `requestBlockReason: string | null`; `getReviewActions` params gain `requestBlockReason: string | null` and set it as the request action's `disabledReason`.
- `TargetReviewPresenter.vm` reads `params.unsavedChanges?.getRequestBlockReason() ?? null`. `openAction("request")` returns early when that is non-null.
- Rendering: the action button is `disabled` when `disabledReason !== null`, with the reason as tooltip.

### app-headless-cms-workflows
- New `presentation/CmsEntryUnsavedChanges.ts` implementing `IReviewUnsavedChanges`: constructed with the form presenter (`ContentEntryFormPresenter.Interface`, the `original` in `CmsEntryFormPresenterReviewDecorator`); returns the CMS reason when `vm.isDirty`, else `null`.
- `getCmsEntryReviewInitParams` input gains `unsavedChanges` and passes it through; the decorator builds one `CmsEntryUnsavedChanges(this.original)` wherever it builds the `CmsEntryContentReloader`.

### app-website-builder-workflows
- New `features/editorReview/WbPageUnsavedChanges.ts` implementing `IReviewUnsavedChanges`: constructed with the document editor; returns the WB reason when `editor.getEditorState().read().autoSaving` is true, else `null`.
- `PageReviewBar.tsx` passes it in `presenter.init`.

## Tests (TDD: RED first)
- `getReviewActions` / `buildTargetReviewViewModel`: request action has `disabledReason` equal to the given reason, `null` otherwise; other actions always `null`.
- `TargetReviewPresenter.test.ts`: with an `unsavedChanges` fake returning a reason, `vm.actions` request is disabled with it; `openAction("request")` does not open; when the fake switches to `null` (observable box), the vm updates.
- Component (ReviewBar or the action button): a request action with `disabledReason` renders a disabled button and the reason text is reachable (tooltip content or `aria-describedby`).
- CMS: `CmsEntryUnsavedChanges` returns the reason for a dirty form fake and `null` for a clean one; the decorator passes it into `init` (existing decorator tests).
- WB: `WbPageUnsavedChanges` returns the reason while `autoSaving`, `null` otherwise; `PageReviewBar` test asserts `unsavedChanges` is passed.

## Commits
One per package, Conventional Commits:
- `fix(app-workflows): block Request review while the editor has unsaved changes`
- `fix(app-headless-cms-workflows): block Request review while the entry form has unsaved edits`
- `fix(app-website-builder-workflows): block Request review while the page is auto-saving`
