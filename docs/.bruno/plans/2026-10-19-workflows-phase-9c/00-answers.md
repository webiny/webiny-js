# Phase 9c — user answers (2026-10-19)

Questions continue the 9b numbering (9b ended at Q59). All answered "accept all" as proposed.

- Q60 Role form: a custom Workflows group in the security role form that matches the design (No access / Full / Custom segment, "Manage workflows" and "Reassign and operate" checkboxes with their descriptions), built as a custom permission element like `CmsPermissions`, not the stock schema renderer. Full access stores `{ name: "workflows.*" }` (the stray `editor: true` is dropped). Custom stores `{ name: "workflows", editor?, reassign? }`. Custom with nothing ticked is stored and reloads as Custom (QBZ-77). Existing `{ name: "workflows.*", editor: true }` roles load as Full. Custom does not require the `aacl` licence (workflows has its own licence).
- Q61 Page placement: one shared page mounted once in `WorkflowsAdminApp`. Settings menu gets a "Workflows" group with the item "Reviewer exclusions" at `/settings/workflows/exclusions`. Group and item are hidden without `editor`. A direct URL without `editor` shows a no-access view instead of not-found; the editor routes get the same change.
- Q62 Data flow: a new `settings/` area in app-workflows next to `editor/` with its own gateway and use cases. The page loads with `getSettings(includeExpired: true)`. Add, Edit and Remove each save at once from their dialog, sending the whole list from the last load. Last save wins, no conflict UI (D106). Toasts go through `Notifications`.
- Q63 Dates: `endsOn` is 23:59:59.999 local time on the picked day, stored as UTC. An entry is active while `endsOn > now`. Editing without changing the date keeps the stored instant. The earliest pickable day is today (local). Hover format follows QBZ-95: "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)"; when the timezone cannot be resolved, UTC is shown. The admin-ui `DateOnlyPicker` is fixed (honour `minDate`, parse `yyyy-MM-dd` as a local date) in its own `fix(admin-ui)` commit.
- Q64 Users: names come from `listUsers({ ids })` in chunks of 200. Missing ids show as "Deleted user"; those rows can still be edited and removed. In the add picker, users already in the list are disabled with the note "In the list" (an optional right-hand note on `WorkflowPicker`). No avatars and no team sub-lines. "Filter by user" lists only the users already in the list, filtered on the client.
- Q65 API: no API changes in 9c. The server does not check that the user exists. `reason` is trimmed and capped at 500 characters on the client; whitespace only counts as empty.
- Q66 List: all entries shown without paging; tabs Active, Expired, All; sort by name, then user id; after an add, the Active tab is selected.
- Q67 Cleanup: delete the unused `HasWorkflowsEditorPermission` and the never-resolved `WorkflowsPermissions` DI feature and its export. The docs task marks spec 13.6 and 13.7, the roadmap row and app.md as built, and adds a short settings and permissions section to api.md.
- Q68 Copy the design lacks:
  1. Name lookup failed: banner "Could not load user names."; rows show the user id.
  2. Server error in a dialog: "Could not save: {server message}".
  3. Picker load failed: "Could not load users."
  4. `NotAuthorized` while loading: the no-access view.
  5. A role with an unrecognised `workflows` entry is read by its flags.
  6. Row labels for screen readers: "Edit exclusion for {Name}" and "Remove exclusion for {Name}".
