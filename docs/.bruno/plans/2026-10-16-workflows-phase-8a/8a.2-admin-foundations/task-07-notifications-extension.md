### Task 7: Notifications: link, duration, position, dismissible, error variant

R207 (user answer Q6, `../00-answers.md`), D125, A70; Review Focus 7. The admin `Notifications` queue (`packages/app-admin/src/features/notifications`) carries only `title` and `description` today, and `NotificationsRenderer` turns each queued notification into one `useToast` call. Workflows toasts (Task 10: `ReviewToasts`, `ReviewNotificationService`) need a link ("Open Content Reviews", "Open content"), a longer duration, a fixed position, a close button and an error variant. This task extends the stack and nothing else: a notification without the new fields produces exactly today's `showToast`/`showSuccessToast`/`showWarningToast` argument, so every other toast in the admin is unchanged. No `Toast.Provider` change and no `visibleToasts` override (the sonner cap is confirmed, not changed, step 5).

- **Types** (`abstractions.ts`): `NotificationVariant = "default" | "success" | "warning" | "error"`; `NotificationPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"`; `INotificationLink { label: string; url: string }`; `INotificationInput` gains `link?: INotificationLink`, `duration?: number`, `position?: NotificationPosition`, `dismissible?: boolean`; `INotifications` gains `error(notification: INotificationInput): void`. `NotificationPosition` is the sonner position union, so it is assignable to `ShowToastParams["position"]` without a cast.
- **Queue** (`Notifications.ts`): `NotificationsImpl.error` pushes with variant `"error"`; `push` already copies every input field onto the queued notification, so the new fields travel with it unchanged.
- **Renderer** (`NotificationsRenderer.tsx`): the toast params are built by one pure function `getToastParams(notification)`: always `title` and `description` (the key is present even when `description` is `undefined`, as today), then `duration`, `position` and `dismissible` only when the notification sets them (plain `if`s, no conditional spreads), then `actions` only when `link` is set: `<SimpleLink to={link.url}>{link.label}</SimpleLink>` (`SimpleLink` from `@webiny/app`, `packages/app/src/presentation/router/components/SimpleLink.tsx`: renders an anchor whose plain left click calls `RouterGateway.pushState(to)`, so an in-app URL navigates without a reload, and cmd/ctrl/middle click and `target="_blank"` keep the browser behaviour). `useToast` wraps a non-`ToastActions` value in `ToastActions` itself. Calls: `default` -> `toast.showToast(params)`; `success` -> `toast.showSuccessToast(params)`; `warning` -> `toast.showWarningToast(params)`; `error` -> sets `params.icon` to the destructive error icon, then `toast.showToast(params)`.
- **Error icon:** `@webiny/icons/error.svg` (a filled error glyph, present in `node_modules/@webiny/icons`), rendered with the admin-ui `Icon` and class `fill-destructive`, the same shape `useToast` uses for its success (`fill-success`) and warning (`fill-warning`) icons. `fill-destructive` is an existing admin-ui token class (`packages/admin-ui/src/Toast`-adjacent components use `fill-destructive`; `--fill-destructive` in the theme CSS). The commit message names the icon.
- **Dismissible:** `Toast` (`packages/admin-ui/src/Toast/Toast.tsx`) defaults `dismissible = true`, so the close button already shows when the field is not passed; `useToast` forwards `dismissible` to sonner and to `Toast` unchanged. The renderer therefore forwards the field only when set and changes nothing in admin-ui (R207: workflows passing `dismissible: true` is harmless and an explicit `false` is the only way to hide the button).
- **Tests:** `Notifications.test.ts` (queue, in node through the real feature) and `NotificationsRenderer.test.tsx` (jsdom, `useToast`, `useFeature` and `SimpleLink` mocked, `@webiny/admin-ui` mocked so no SVG or sonner is loaded).

**Files:**
- Modify: `packages/app-admin/src/features/notifications/abstractions.ts`
- Modify: `packages/app-admin/src/features/notifications/Notifications.ts`
- Modify: `packages/app-admin/src/features/notifications/NotificationsRenderer.tsx`
- Create: `packages/app-admin/src/features/notifications/Notifications.test.ts`
- Create: `packages/app-admin/src/features/notifications/NotificationsRenderer.test.tsx`

**Interfaces:**
- Consumes (existing, verified): `useToast`, `ShowToastParams` and `Icon` (`@webiny/admin-ui`, `packages/admin-ui/src/Toast/useToast.tsx`, `packages/admin-ui/src/index.ts` re-exports `./Toast/index.js` and `./Icon/index.js`); `useFeature` and `SimpleLink` (`@webiny/app`, `packages/app/src/index.ts` exports both); `NotificationsFeature` (`./feature.js`); `createAbstraction` (`@webiny/feature/admin`); `ReactComponent` from `@webiny/icons/error.svg`.
- Produces: `NotificationVariant` (adds `"error"`), `NotificationPosition`, `INotificationLink`, `INotificationInput.link/duration/position/dismissible`, `INotifications.error(input)` (`@webiny/app-admin/features/notifications/abstractions.js`; Task 10 consumes the four new input fields and `error` through `Notifications.Interface`).

**Test runner note:** `packages/app-admin` runs `yarn test <path>` only (`packages/app-admin/vitest.config.ts`, jsdom, `@testing-library/react` already a devDependency; it is not an `-es`/`-os` package). The root `tsconfig.build.json` uses the classic JSX runtime (`"jsx": "react"`), so every `.tsx` test imports `React`. The vitest config registers no SVG transform, so the renderer test mocks `@webiny/icons/error.svg`. Before committing run `git status --short`; stage only files this task touches; leave any untracked probe files alone (if `git add .` picks them up, unstage them).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-admin/src/features/notifications/Notifications.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { NotificationsFeature } from "./feature.js";
import { Notifications } from "./abstractions.js";

const createNotifications = (): Notifications.Interface => {
    const container = new Container();
    NotificationsFeature.register(container);
    return container.resolve(Notifications);
};

describe("Notifications", () => {
    let notifications: Notifications.Interface;

    beforeEach(() => {
        notifications = createNotifications();
    });

    it("queues a plain notification with exactly its own fields", () => {
        notifications.notify({ title: "Saved", description: "All good." });

        expect(notifications.getNotifications()).toEqual([
            { id: "notification-1", variant: "default", title: "Saved", description: "All good." }
        ]);
    });

    it("queues success and warning notifications with their variant", () => {
        notifications.success({ title: "Done" });
        notifications.warning({ title: "Careful" });

        const queued = notifications.getNotifications();
        expect(queued.map(item => item.variant)).toEqual(["success", "warning"]);
        expect(queued.map(item => item.id)).toEqual(["notification-1", "notification-2"]);
    });

    it("queues an error notification with the error variant", () => {
        notifications.error({ title: "Failed", description: "Try again." });

        expect(notifications.getNotifications()).toEqual([
            { id: "notification-1", variant: "error", title: "Failed", description: "Try again." }
        ]);
    });

    it("keeps link, duration, position and dismissible on the queued notification", () => {
        notifications.success({
            title: "Requested",
            description: "Spring launch",
            link: { label: "Open Content Reviews", url: "/cms/content-reviews" },
            duration: 8000,
            position: "bottom-right",
            dismissible: true
        });

        expect(notifications.getNotifications()).toEqual([
            {
                id: "notification-1",
                variant: "success",
                title: "Requested",
                description: "Spring launch",
                link: { label: "Open Content Reviews", url: "/cms/content-reviews" },
                duration: 8000,
                position: "bottom-right",
                dismissible: true
            }
        ]);
    });

    it("removes a notification by id and leaves the others", () => {
        notifications.notify({ title: "One" });
        notifications.error({ title: "Two" });
        notifications.warning({ title: "Three" });

        notifications.remove("notification-2");

        expect(notifications.getNotifications().map(item => item.title)).toEqual([
            "One",
            "Three"
        ]);
    });
});
```

Create `packages/app-admin/src/features/notifications/NotificationsRenderer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { NotificationsRenderer } from "./NotificationsRenderer.js";
import type { INotification } from "./abstractions.js";

interface RendererMocks {
    toast: {
        showToast: ReturnType<typeof vi.fn>;
        showSuccessToast: ReturnType<typeof vi.fn>;
        showWarningToast: ReturnType<typeof vi.fn>;
    };
    presenter: {
        vm: { notifications: INotification[] };
        markShown: ReturnType<typeof vi.fn>;
    };
}

const mocks = vi.hoisted((): RendererMocks => {
    return {
        toast: {
            showToast: vi.fn(),
            showSuccessToast: vi.fn(),
            showWarningToast: vi.fn()
        },
        presenter: {
            vm: { notifications: [] },
            markShown: vi.fn()
        }
    };
});

vi.mock("@webiny/admin-ui", async () => {
    const react = await import("react");
    return {
        useToast: () => mocks.toast,
        Icon: (props: { className?: string }) => {
            return react.createElement("span", {
                "data-testid": "toast-icon",
                className: props.className
            });
        }
    };
});

vi.mock("@webiny/app", async () => {
    const react = await import("react");
    return {
        useFeature: () => ({ presenter: mocks.presenter }),
        SimpleLink: (props: { to: string; children?: React.ReactNode }) => {
            return react.createElement("a", { href: props.to }, props.children);
        }
    };
});

vi.mock("@webiny/icons/error.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("./feature.js", () => {
    return { NotificationsFeature: {} };
});

const notificationOf = (overrides: Partial<INotification>): INotification => {
    return { id: "notification-1", variant: "default", title: "Title", ...overrides };
};

const renderQueue = (notifications: INotification[]): void => {
    mocks.presenter.vm = { notifications };
    render(<NotificationsRenderer />);
};

describe("NotificationsRenderer", () => {
    beforeEach(() => {
        mocks.toast.showToast.mockReset();
        mocks.toast.showSuccessToast.mockReset();
        mocks.toast.showWarningToast.mockReset();
        mocks.presenter.markShown.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    describe("a notification without the new fields keeps today's call", () => {
        it("default calls showToast with title and description only", () => {
            renderQueue([notificationOf({ description: "Body" })]);

            expect(mocks.toast.showToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body"
            });
            expect(mocks.toast.showSuccessToast).not.toHaveBeenCalled();
            expect(mocks.toast.showWarningToast).not.toHaveBeenCalled();
            expect(mocks.presenter.markShown).toHaveBeenCalledTimes(1);
            expect(mocks.presenter.markShown).toHaveBeenCalledWith("notification-1");
        });

        it("default without a description keeps the description key undefined", () => {
            renderQueue([notificationOf({})]);

            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: undefined
            });
        });

        it("success calls showSuccessToast with title and description only", () => {
            renderQueue([notificationOf({ variant: "success", description: "Body" })]);

            expect(mocks.toast.showSuccessToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showSuccessToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body"
            });
            expect(mocks.toast.showToast).not.toHaveBeenCalled();
            expect(mocks.presenter.markShown).toHaveBeenCalledTimes(1);
        });

        it("warning calls showWarningToast with title and description only", () => {
            renderQueue([notificationOf({ variant: "warning", description: "Body" })]);

            expect(mocks.toast.showWarningToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showWarningToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body"
            });
            expect(mocks.toast.showToast).not.toHaveBeenCalled();
            expect(mocks.presenter.markShown).toHaveBeenCalledTimes(1);
        });
    });

    describe("a notification with the new fields", () => {
        it("passes duration, position and dismissible through", () => {
            renderQueue([
                notificationOf({
                    variant: "success",
                    description: "Body",
                    duration: 8000,
                    position: "bottom-right",
                    dismissible: true
                })
            ]);

            expect(mocks.toast.showSuccessToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body",
                duration: 8000,
                position: "bottom-right",
                dismissible: true
            });
        });

        it("forwards an explicit dismissible false and a zero duration", () => {
            renderQueue([notificationOf({ dismissible: false, duration: 0 })]);

            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: undefined,
                duration: 0,
                dismissible: false
            });
        });

        it("passes only the fields that are set", () => {
            renderQueue([notificationOf({ position: "top-center" })]);

            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: undefined,
                position: "top-center"
            });
        });

        it("renders the link as an in-app link action", () => {
            renderQueue([
                notificationOf({
                    variant: "success",
                    link: { label: "Open Content Reviews", url: "/cms/content-reviews" }
                })
            ]);

            const params = mocks.toast.showSuccessToast.mock.calls[0][0];
            expect(React.isValidElement(params.actions)).toBe(true);

            render(<div>{params.actions}</div>);

            const link = screen.getByRole("link", { name: "Open Content Reviews" });
            expect(link.getAttribute("href")).toBe("/cms/content-reviews");
        });

        it("adds no actions without a link", () => {
            renderQueue([notificationOf({ duration: 8000 })]);

            expect(mocks.toast.showToast.mock.calls[0][0]).not.toHaveProperty("actions");
        });

        it("error calls showToast with the destructive error icon and the other fields", () => {
            renderQueue([
                notificationOf({
                    variant: "error",
                    description: "Body",
                    duration: 8000,
                    position: "bottom-right",
                    dismissible: true
                })
            ]);

            expect(mocks.toast.showToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showSuccessToast).not.toHaveBeenCalled();
            expect(mocks.toast.showWarningToast).not.toHaveBeenCalled();

            const params = mocks.toast.showToast.mock.calls[0][0];
            expect(params.title).toBe("Title");
            expect(params.description).toBe("Body");
            expect(params.duration).toBe(8000);
            expect(params.position).toBe("bottom-right");
            expect(params.dismissible).toBe(true);
            expect(React.isValidElement(params.icon)).toBe(true);
            expect(params.icon.props.className).toBe("fill-destructive");
        });

        it("error without the new fields still shows through showToast with the icon", () => {
            renderQueue([notificationOf({ variant: "error" })]);

            const params = mocks.toast.showToast.mock.calls[0][0];
            expect(Object.keys(params).sort()).toEqual(["description", "icon", "title"]);
        });
    });

    it("shows every queued notification oldest first and marks each shown once", () => {
        renderQueue([
            notificationOf({ id: "notification-1", title: "One" }),
            notificationOf({ id: "notification-2", variant: "warning", title: "Two" }),
            notificationOf({ id: "notification-3", variant: "error", title: "Three" })
        ]);

        expect(mocks.toast.showToast.mock.calls.map(call => call[0].title)).toEqual([
            "One",
            "Three"
        ]);
        expect(mocks.toast.showWarningToast.mock.calls[0][0].title).toBe("Two");
        expect(mocks.presenter.markShown.mock.calls.map(call => call[0])).toEqual([
            "notification-1",
            "notification-2",
            "notification-3"
        ]);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-admin/src/features/notifications/Notifications.test.ts 2>&1 | tail -50
yarn test packages/app-admin/src/features/notifications/NotificationsRenderer.test.tsx 2>&1 | tail -60
```

Expected: FAIL.
- `Notifications.test.ts`: the `error` tests fail with `notifications.error is not a function`; the other queue tests already pass (the queue copies the input fields; the new fields are only a type error, which vitest does not check).
- `NotificationsRenderer.test.tsx`: the four "today's call" tests pass (the existing renderer already sends exactly `title` and `description`); every "with the new fields" test fails except "adds no actions without a link" (`duration`, `position`, `dismissible`, `actions` and `icon` are missing from the call), and the "error without the new fields" and "error calls showToast" tests fail on the missing `icon`. The oldest-first test passes today (titles and ids already come out in order).

- [ ] **Step 3: Implement**

`packages/app-admin/src/features/notifications/abstractions.ts`, replace the first block (the variant type and `INotificationInput`) and add `error` to `INotifications`. Before:

```ts
export type NotificationVariant = "default" | "success" | "warning";

export interface INotificationInput {
    title: string;
    description?: string;
}
```

After:

```ts
export type NotificationVariant = "default" | "success" | "warning" | "error";

export type NotificationPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

export interface INotificationLink {
    label: string;
    url: string;
}

export interface INotificationInput {
    title: string;
    description?: string;
    link?: INotificationLink;
    duration?: number;
    position?: NotificationPosition;
    dismissible?: boolean;
}
```

In the same file, replace the doc comment and the `INotifications` interface head. Before:

```ts
 * App-wide notification queue. Any feature can inject this and call `notify()` / `success()` /
 * `warning()` to surface a notification on screen, without depending on React or the toast UI.
 */
export interface INotifications {
    notify(notification: INotificationInput): void;
    success(notification: INotificationInput): void;
    warning(notification: INotificationInput): void;
```

After:

```ts
 * App-wide notification queue. Any feature can inject this and call `notify()` / `success()` /
 * `warning()` / `error()` to surface a notification on screen, without depending on React or the
 * toast UI.
 */
export interface INotifications {
    notify(notification: INotificationInput): void;
    success(notification: INotificationInput): void;
    warning(notification: INotificationInput): void;
    error(notification: INotificationInput): void;
```

`packages/app-admin/src/features/notifications/Notifications.ts`, add `error` after `warning`. Before:

```ts
    warning(input: INotificationInput): void {
        this.push(input, "warning");
    }
```

After:

```ts
    warning(input: INotificationInput): void {
        this.push(input, "warning");
    }

    error(input: INotificationInput): void {
        this.push(input, "error");
    }
```

`packages/app-admin/src/features/notifications/NotificationsRenderer.tsx`, replace the whole file:

```tsx
import React from "react";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { SimpleLink } from "@webiny/app";
import { useFeature } from "@webiny/app";
import { Icon } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import type { ShowToastParams } from "@webiny/admin-ui";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { NotificationsFeature } from "./feature.js";
import type { INotification } from "./abstractions.js";

type Toast = ReturnType<typeof useToast>;

const getToastParams = (notification: INotification): ShowToastParams => {
    const params: ShowToastParams = {
        title: notification.title,
        description: notification.description
    };

    if (notification.duration !== undefined) {
        params.duration = notification.duration;
    }

    if (notification.position !== undefined) {
        params.position = notification.position;
    }

    if (notification.dismissible !== undefined) {
        params.dismissible = notification.dismissible;
    }

    if (notification.link) {
        params.actions = (
            <SimpleLink to={notification.link.url}>{notification.link.label}</SimpleLink>
        );
    }

    return params;
};

const showNotification = (toast: Toast, notification: INotification) => {
    const params = getToastParams(notification);

    switch (notification.variant) {
        case "success":
            toast.showSuccessToast(params);
            break;
        case "warning":
            toast.showWarningToast(params);
            break;
        case "error":
            params.icon = <Icon icon={<ErrorIcon />} label={""} className={"fill-destructive"} />;
            toast.showToast(params);
            break;
        default:
            toast.showToast(params);
    }
};

/**
 * Standalone consumer of the Notifications queue. Drains queued notifications oldest-first
 * and shows each one as a toast, then removes it from the queue. Mounted once, app-wide.
 */
export const NotificationsRenderer = observer(() => {
    const { presenter } = useFeature(NotificationsFeature);
    const toast = useToast();

    const ids = presenter.vm.notifications.map(notification => notification.id).join("|");

    useEffect(() => {
        presenter.vm.notifications.forEach(notification => {
            showNotification(toast, notification);
            presenter.markShown(notification.id);
        });
        // `ids` captures queue changes; `toast`/`presenter` are stable singletons.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ids]);

    return null;
});
```

Notes on the file: the original had no `React` import because it used no JSX; the new code returns JSX, and the classic JSX runtime needs `React` in scope, hence `import React from "react"` next to `import { useEffect } from "react"`. In the `error` case `params` is the local object built a line above, so setting `icon` there is a plain assignment, not a conditional spread.

The `Icon` props were verified in `packages/admin-ui/src/Icon/Icon.tsx`: `label: string` (required) and `icon: React.ReactNode`, so `label={""}` as `useToast` passes it type-checks.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-admin/src/features/notifications/Notifications.test.ts 2>&1 | tail -50
yarn test packages/app-admin/src/features/notifications/NotificationsRenderer.test.tsx 2>&1 | tail -60
```

Expected: PASS (5 tests in `Notifications.test.ts`, 11 in `NotificationsRenderer.test.tsx`).

- [ ] **Step 5: Confirm A70, run the existing tests covering the changed code and type-check**

A70, the sonner cap, is confirmed here and recorded in the commit body; no override is added:

```bash
grep -n "const VISIBLE_TOASTS_AMOUNT\|visibleToasts = VISIBLE_TOASTS_AMOUNT" node_modules/sonner/dist/index.mjs
grep '"version"' node_modules/sonner/package.json
grep -rn "visibleToasts" packages/admin-ui/src packages/app-admin/src | wc -l
```

Expected: `const VISIBLE_TOASTS_AMOUNT = 3;` and `visibleToasts = VISIBLE_TOASTS_AMOUNT` in the `Toaster` props destructuring, version `2.0.8`, and `0` (no admin-ui or app-admin code overrides `visibleToasts`; `Toast.Provider` passes only `expand`, `duration`, `position` and the caller's props). This check verifies only the cap of 3 visible toasts (older ones are hidden); it does not verify ordering. If the version or the number differs, stop and record it under Contract notes instead of continuing.

Other tests that touch the Notifications abstraction (a quick check that no other implementation of `INotifications` breaks now that it gained `error`):

```bash
grep -rln "INotifications\|Notifications.Interface" packages --include='*.ts' --include='*.tsx' | grep -v "node_modules\|/dist/"
yarn check:test:types -p app-admin --report cli 2>&1 | tail -40
```

Expected: the `grep` lists only the notifications feature itself plus consumers that call it (a hand-written fake that implements `INotifications` would now miss `error`; if one appears, add `error: vi.fn()` or the method to that fake in this task and say so under Contract notes), and the type check prints no errors. Verify manually in the running admin before the sub-phase review: a notification with a `link` renders a link inside the toast that navigates in app on a plain click (the `Toaster` is mounted by `AdminUiProvider` inside `UiProviders`, under `DiContainerProvider`, `packages/app-admin/src/base/Admin.tsx`, so `SimpleLink` can resolve `RouterGateway`; verify: React portals keep that context, which the unit test cannot show because `SimpleLink` is mocked there).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git status --short packages/app-admin
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-admin --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-admin): add link, duration, position, dismissible and error variant to notifications" -m "The renderer forwards only the fields a notification sets, so existing toasts keep their exact arguments. The error variant uses the error icon from @webiny/icons with the fill-destructive class. Sonner 2.0.8 caps the visible toasts at 3 per position (VISIBLE_TOASTS_AMOUNT) and nothing here overrides it." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- The error icon file is `@webiny/icons/error.svg`; the contract leaves the icon to the task ("an existing error icon, named in the commit").
- `jsx` is `react` (classic) in `tsconfig.build.json`, so the renderer imports `React`.
- Size: small. Two modified source files plus one rewritten renderer, two test files.
