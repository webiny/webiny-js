# Command Palette for Webiny Admin

Design source: https://claude.ai/design/p/2c38bad4-23b8-44aa-9705-174bf78a177a (`Command Palette.dc.html`)

A `⌘K` / `Ctrl+K` command palette for the Webiny admin app: fuzzy search over navigation destinations and actions, keyboard-driven, three groups (Recent / Navigation / Actions). Recent is deferred; first release ships **Navigation + Actions**.

## Decisions (locked)

- **Scope v1:** Navigation + Actions. Recent deferred (needs route-history / ACO integration).
- **UI library:** `cmdk` — already a transitive dependency via `@webiny/admin-ui`'s `Command` primitive. Reuse it; no new dependency.
- **Actions API:** new composition-based `AdminConfig.CommandPalette` registry, consistent with existing `AdminConfig.Menu` / `AdminConfig.Dashboard.Widget`.

## Grounding (what already exists)

| Concern                                      | Location                                                                      | Notes                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Global hotkeys                               | `packages/app-admin/src/hooks/useHotkeys.ts`                                  | zIndex-layered global keydown via `is-hotkey`. Throws if a key is double-registered on the same zIndex.                    |
| Admin config                                 | `packages/app-admin/src/config/AdminConfig.tsx`                               | `AdminConfig` interface + `useAdminConfig()`. Composition config assembled with `ConnectToProperties`/`Property`.          |
| Config item pattern to mirror                | `packages/app-admin/src/config/AdminConfig/Widget.tsx`                        | `Widget` config → array property with pin/before/after ordering. Copy this shape for `Command`.                            |
| Menu config (Navigation source)              | `packages/app-admin/src/config/AdminConfig/Menu.tsx`                          | `MenuConfig = { name, parent, tags, element, pinnable, hideIfEmpty }`. Label/icon/path live inside `element.props`.        |
| Menu item props                              | `packages/admin-ui/src/Sidebar/components/items/SidebarMenuItem.tsx`          | `SidebarMenuItemBaseProps`: `text` (ReactNode), `icon`, `variant: "group-label"`; link variant adds `to`/`route`/`params`. |
| cmdk primitive                               | `packages/admin-ui/src/Command/Command.tsx`                                   | `Command` + `.Input .List .Item .Group .Empty .Separator .Loading`. Wraps `cmdk`.                                          |
| Admin UI shell (mount point)                 | `packages/app-admin-ui/src/index.tsx`                                         | `AdminUI` renders `<Navigation/> <Dialog/>` etc. Palette mounts here.                                                      |
| Navigation render (menu tree walk reference) | `packages/app-admin-ui/src/Navigation/SidebarMenuItems.tsx`                   | Recursive parent/child walk over `menus`. Reuse the traversal logic for deriving nav commands.                             |
| Toast                                        | `NotificationsRenderer` (notifications feature, already wired in `Admin.tsx`) | Fire on action run.                                                                                                        |

## Architecture

### Registry — `@webiny/app-admin`

New dir `packages/app-admin/src/config/AdminConfig/CommandPalette/`, mirroring `Widget.tsx`.

- Add `commands: CommandConfig[]` to the `AdminConfig` interface and to the `useAdminConfig()` return (`?? []`).
- Register `CommandPalette` on the `AdminConfig` object (`Object.assign(Private, { ..., CommandPalette })`).
- Expose `AdminConfig.CommandPalette.Command`.

```ts
interface CommandConfig {
  name: string; // unique id + ordering key
  group?: string; // default "Actions"
  label: string;
  description?: string; // design "sub"
  icon?: React.ReactNode;
  keywords?: string; // design "kw" — extra search terms
  shortcut?: string[]; // design "keys" chips
  onSelect: () => void; // design "run"
  pin?: "first" | "last";
  before?: string;
  after?: string;
}
```

### UI — `@webiny/app-admin-ui`

New dir `packages/app-admin-ui/src/CommandPalette/`, mounted in `AdminUI` beside `<Navigation/>`.

- admin-ui `Dialog` (scrim + blur, centered-top) wrapping `Command` (cmdk).
- cmdk provides filtering + arrow-key nav + Enter-select natively — replaces the hand-rolled `filtered()`/`onKey()`/`sel` logic in the `.dc.html`.
- Style with design-system tokens per the `.dc.html` (search row, grouped list, footer hints).

### Command sources

| Group      | Source                                                                                                      | Select action        |
| ---------- | ----------------------------------------------------------------------------------------------------------- | -------------------- |
| Navigation | walk `useAdminConfig().menus`; leaf items with `to`/`route` → `{ label: props.text, icon: props.icon, to }` | navigate             |
| Actions    | `useAdminConfig().commands`                                                                                 | `onSelect()` + toast |
| Recent     | deferred                                                                                                    | —                    |

### Open / close

- `useHotkeys({ zIndex: <dedicated high layer>, keys: { "mod+k": toggle } })` — palette gets its own zIndex layer to avoid the double-register throw.
- Esc + scrim-click close (Dialog/cmdk native).
- Header trigger button ("Search or jump to… ⌘K") added to the topbar (design shows it in the header). The floating reopen button in the `.dc.html` is a demo affordance — skip.

### Toast

Reuse notifications feature. Default message: "Navigating to X" for nav, action label for actions; commands may override.

## Phases (tracer-bullet, each independently shippable)

1. **Shell** — Dialog + cmdk wired to `⌘K`/`Ctrl+K`; Esc + scrim close; input focus management; themed to design. No commands yet. Proves open/close + theming.
2. **Navigation** — derive commands from `menus`, selecting navigates. First genuinely useful state.
3. **Actions registry** — `AdminConfig.CommandPalette.Command` + `commands` in `AdminConfig`; render Actions group; wire `onSelect` + toast.
4. **Seed core actions** — CMS new-entry / publish, Page Builder new-page, File Library upload, Settings invite user, API playground — each registered from its owning module's config.
5. **Polish** — header search trigger, empty state, group ordering, shortcut chips, footer hints (↑↓ navigate / ↵ select / ⌘K).

Recent deferred to a later phase (route-visit history + recently-edited entries).

## Status (implemented)

- **P1–P3 done, P4–P5 done** on branch `command-palette`.
- P4 scope note: the registry ships plus two real global actions ("Copy current URL",
  "Sign out"). Rich per-module create/mutate actions (new entry, publish, upload, invite)
  are a **follow-up owned by each module** — they need module create flows, not the
  param-free routes the access-management/file-manager menus expose.
- P5: header trigger ("Search or jump to… ⌘K") wired via a `CommandPaletteProvider`
  (shared open state for hotkey + button). Empty state keeps the `search_off` icon;
  wiring the DS "Blank state" illustration asset is a later polish.
- Still open: **Recent** group; automated tests; zIndex-layering caveat when another
  high-zIndex hotkey layer is open.

## Risks / verify in phase 1

- **`props.text` is `ReactNode`, not `string`** — cmdk search needs a string. Likely need an optional `searchLabel` on the menu config, or coerce ReactNode → text. Biggest unknown; resolve before phase 2.
- Existing admin-ui `Command` styling — confirm where it's used today (combobox?) and that it themes cleanly for a full-screen palette context.
- `useHotkeys` zIndex interplay when a Dialog is already open (nested layers).
- Programmatic navigation API — confirm `useRoute` / `useNavigate` usage for select-to-navigate.
