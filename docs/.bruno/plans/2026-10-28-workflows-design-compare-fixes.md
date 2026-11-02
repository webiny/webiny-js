# Workflows design-compare fixes (2026-10-28, second compare)

Source: the design-vs-live comparison. The design frames were served over HTTP and each one was compared with the matching live screenshot (session scratchpad `compare/`).

Out of scope (user decisions stand):
- the rejected review tag stays the dark variant everywhere
- the rejected state gets the hint text with no "Create new revision" button

Not ours: placeholder-grey values come from admin-ui internals.

## Rules (binding)

These are the same as `2026-10-28-workflows-live-check-fixes.md` → "Rules (binding)":
- admin-ui is the source of truth.
- No colours or visual styling in our code; layout utilities and theme tokens only.
- Beware that `--spacing-*` shadows the `xs`…`xl` width names, so use `w-2xs`, `w-3xs`, `max-w-2xl`, fractions or the numeric scale.
- Missing components go to "Needs a design-system component" in that file.
- Never change admin-ui, app-admin, app-headless-cms, app-website-builder or api-headless-cms.
- Tests use `data-*` hooks and never assert classes.
- Tests run one at a time.
- Run the pre-commit chain before committing. One commit per package. Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never amend, never push.

Paths are relative to `packages/app-workflows/src/` unless noted.

## Part A: dashboard, editor, step drawers

1. **Widgets subtitle.** The review widgets show a "Website Builder" subtitle even when they mix apps. Remove the per-app subtitle. If a widget instance is bound to one app, keep its app label only where the design shows it; the design shows none, so drop it. Find where `description`/subtitle is set in `review/presentation/reviewWidget`.
2. **Widgets row cap.** Show at most 5 rows. Use the existing "View all" link for the rest.
3. **Website Builder widget rows.** The secondary line must follow `{step} · {type} ({app})`. Website Builder rows lack the type, so give them the WB content type label `Pages` from the WB binding, the same source the list uses.
4. **Editor drag handle.** Steps can only be reordered with ↑/↓ right now; the drag handle is missing. Check how `StepCard.tsx` passes `draggable` and `dragHandleRef` to `Accordion.Item`, and how admin-ui `Accordion` renders the handle (hover only? needs a prop?). Restore drag reordering with the handle and keep the ↑/↓ actions. Test: the handle renders and is wired to the sortable ref.
5. **Editor step column width.** The step list (and its Add step button) sits in a centred column capped at `max-w-2xl` (layout wrapper with `mx-auto w-full max-w-2xl`). It does not fill the whole pane.
6. **Editor header.**
   - The workflow title must start at the same left edge as the subtitle. Remove our offset wrapper/padding causing the ~12px shift.
   - The "Unsaved changes" tag sits next to the title, not by Save/More actions.
   - A single mouse click on the title starts editing, the same as Enter/F2 on the focusable trigger.
7. **Add step type picker order.** The order must be People, Automation, AI.
8. **"Create workflow" button.** Give it the admin-ui `add` icon.
9. **Model panel rows.** Every model row's description is "N steps" when it has a workflow, or "No workflow" when it has none. It is not the workflow name, and this applies to selected and unselected rows alike.
10. **Step drawer copy and tags.**
    - The transport label is "E-mail", not "E-Mail". Fix it in the transport definition or label mapping. If the label comes from the API, fix it in the api package with its own commit.
    - The "Changes content" tag uses the admin-ui `Tag` warning variant.
11. **Test routing button.** The "Test routing" button is enabled even when no requester is chosen. On click without a requester, show the existing "Choose a requester to test." message as the field's validation error (`FormComponentErrorMessage`) and don't run.

## Part B: review bar, popover, drawer, list, settings, WB strip

12. **Review bar headline row.**
    - The review state tag sits inline with the headline message, on the same row, wrapping as needed.
    - The lock text ("Editing, publishing and moving are locked…") sits on its own line below the meta row.
13. **Steps popover.**
    - Rows show title, owner and comment/message only. Remove the step description line.
    - Anchor the popover under the progress row's left: make the trigger wrapper cover the progress bar and the count button together, with `align="start"`. Keep the keyboard and focus behaviour from `9dd2756a54`.
14. **Details drawer issues.** In "Issues reported by the AI", the severity `Tag` comes first, then the field name, then the text.
15. **Content Reviews "Current step" cell.** It uses the same `Text` size as the other cells.
16. **"Not in a reviewing team" empty state.** If admin-ui `EmptyState` accepts an icon (check its props), use the `group_off`/person-off icon. Otherwise leave it and note it under "Needs a design-system component".
17. **Exclusions page.**
    - The rule lines sit in an admin-ui `Card`.
    - Remove the extra visible "Filter by user" label. Keep an accessible name on the control if admin-ui lets you.
    - The user filter is `w-2xs` (288px) with the Active/Expired/All tabs right next to it, not stretched.
18. **Website Builder read-only Alert under the strip** (`packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`). Its margins are symmetric, `mx-md`, so it doesn't run into the right edge. If the parent width forces the overflow, fix the wrapper's width instead (`w-full`/`min-w-0`, no `max-w-screen` overflow).
