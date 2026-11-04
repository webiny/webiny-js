# Workflows compare-3 fixes (2026-10-29)

Source: the third design-vs-live comparison. Screenshots are in the session scratchpad `compare3/`.

## Rules (binding)

These are the same as `2026-10-28-workflows-live-check-fixes.md` → "Rules (binding)":
- admin-ui is the source of truth.
- No colours or visual styling in our code; layout utilities and theme tokens only.
- Beware that `--spacing-*` shadows the `xs`…`xl` width names, so use `w-2xs`, `w-3xs`, fractions or the numeric scale.
- Missing components go to "Needs a design-system component" in that file.
- Never change admin-ui, app-admin, app-headless-cms, app-website-builder or api-headless-cms.
- Tests use `data-*` hooks and never assert classes.
- Tests run one file at a time, never in parallel.
- Run the pre-commit chain from `CLAUDE.md` before each commit. One commit per package and item. Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never amend, never push.

Paths are relative to `packages/app-workflows/src/` unless noted.

## Part A: list, widgets, dialogs, settings

1. **Content Reviews filter size.** In `review/presentation/reviewList/components/ReviewListToolbar.tsx` and `ReviewContentTypePicker.tsx`, the selects are 40px tall. The CMS list toolbar controls are 32px (app-admin `ListView.Header`: `Input size="md" variant="ghost"`, `FiltersToggle`, `Button`). Give our `Select`/`MultiAutoComplete` the admin-ui size prop value that renders the same height as the CMS toolbar controls. Check the prop values in admin-ui.
2. **Content Reviews footer.** The CMS and Website Builder lists use app-admin `ListView.BottomBar` ("Showing N out of M entries."). Check what `ListViewBottomBar.tsx` renders and whether it can be used without the ListView context. If it can, use it. If it can't, render the same admin-ui components and layout it uses: the text "Showing {shown} out of {total} reviews.", or "Showing {shown} reviews." when no total is known, plus the "Load more" button when more exist. It replaces the centred "That's everything." footer in `ReviewListTable.tsx`.
3. **Website Builder sidebar icon.** The WB list sidebar "Content Reviews" item uses a briefcase icon. Use `@webiny/icons/flowchart.svg`, the same as the CMS item and the page title (`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.tsx`).
4. **Default value instead of placeholder.**
   - "All content types": `ReviewContentTypePicker`.
   - "All users": the exclusions page user filter.
   - "Root (no folder)": the test routing folder field.
   These show the placeholder style. Make the default a real selected option/value so it renders as a value, the same way the review-state selects use the `all` option. Keep the existing behaviour: the default still means no filter / root.
5. **Dashboard widgets, one pair.** Each app mounts its own "For me to review" and "My requests" widgets, so the dashboard shows two pairs. Find the mounting in `review/presentation/reviewWidget` and the app packages. Show one pair whose rows cover all apps with workflows enabled, using the `{step} · {type} ({app})` secondary line. If the data source is per app, combine the app row providers, or merge the queries by namespace. Batch them; never query in a loop. If one pair isn't possible without changing base packages, stop and report.
6. **Website Builder read-only notice.** `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx` renders a "Read-only while this revision is in review." Alert under the strip. It repeats the strip's lock text, so remove it. If anything else depends on it, report that instead.
7. **Request review dialog radios.** The Automatic / Choose a person `RadioGroup` is stacked. Use the admin-ui horizontal direction prop.
8. **Exclusion dialog Until date.** The Until date input fills the dialog width. Give its wrapper a fixed width, `w-3xs` (256px) or the closest theme token.
9. **Exclusions info facts.** The four info facts are a vertical list. Lay them out as one row of four columns (`grid grid-cols-4 gap-md`) using the existing components. Add a frame only if an admin-ui component provides it, such as `Card`.

## Part B: notifications

10. **Notification copy.** Notifications currently say "{actor} approved/rejected {title}", one per step, and AI steps show "AI review" as the actor. The design (`docs/.bruno/workflows/design/files/Notifications.dc.html`) specifies different copy.
    - Read that design file for the exact strings.
    - Find where the copy is built. It may be the api package (`api-workflows` notification builders) or the admin; fix it where it is built, and use a separate commit per package.
    - Match the design copy: review-level outcome "“{title}” was approved" and "“{title}” was rejected at {step}"; the body line, for example "{step} · requested by {requester}"; the Open content link, if the notification data carries the URL; and the step title, not "AI review", as the AI actor.
    - Keep per-step "step approved" notices only if the design has them.
    - Tests: copy assertions for each notification kind.
