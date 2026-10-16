### Task 23: WB publish and autosave rules

Spec 13.1, 13.4; R225 (no editing or publishing while the status is unknown), R226 (lock and publish rules), A73 (Publish sits inside `Ui.IsNotReadOnly`), A78 (each extension point is decorated once, the old decorator is replaced); D79, D80, D85, D121; QBZ-1, QBZ-36; Review Focus 3, 4, 8, 16, 17. The base Website Builder editor shows Publish only while the canvas is editable. An approved revision is read-only (the canvas never opens again, D121), so the base Publish cannot show for it, and a decorator on `buttonPublish` cannot bring it back. This task adds the Publish the review rules need, hides the base one, and gates autosave.

- **A73 decision (stated, with why):** a workflows-registered `Ui.TopBar.Action` named `buttonWorkflowPublish`, registered **outside** any `Ui.IsNotReadOnly`/`Ui.IsReadOnly` condition (inside the page editor secondary config, wrapped only in the base `HasPermission entity="page" action="publish"`), plus one decorator of `Ui.TopBar.Action` that hides the base `buttonPublish` unless the namespace has no workflow. The "cleaner switch" was looked for and does not exist: `Ui.TopBar.Action` takes `remove`, `before`, `after`, `name`, `element`, `group` only (`BaseEditor/config/Element.tsx`), and `Ui.IsNotReadOnly` has no override. `remove` on `buttonPublish` would also drop the base button for pages without a workflow and the base `HasPermission` wrapper, which would then have to be copied. A workflows action is also required for QBZ-1/QBZ-36: while the status loads or failed the canvas is read-only (R225), the base Publish is gone with it, yet the design wants a visible disabled Publish with a reason. The new button reuses the base `PublishButton` (publish dialog, revision description, publish call, redirect to the list) when publishing is allowed, so none of that logic is copied.
- **Who shows what (`vm.status`, `vm.allowsPublishing`, page status):** `noWorkflow`: the base Publish only (the workflows action renders nothing; the base shows when the canvas is editable, as today). `loading`, `failed`, `none`, `active`: the base Publish is hidden by the decorator; the workflows action renders the base `PublishButton` when `vm.allowsPublishing` (approved), else a disabled button with `vm.publishDisabledReason`. A `published` page shows no Publish from workflows (it is already published; the base one is not mounted for a read-only canvas either). An approved revision shows an enabled Publish whether the page is a draft (canvas read-only because of the review) or unpublished (approved, later unpublished keeps "Review: Approved" with Publish enabled, R226).
- **Disabled Publish (QBZ-36, R-b):** `DisabledPublishButton` takes the presenter and renders an admin-ui `Button` with `aria-disabled="true"` (not the `disabled` attribute, so it stays focusable), no click handler and `type="button"`, wrapped in the shared `ReviewTooltip` (`{ presenter; children }`, Task 14), which supplies the reason tooltip on hover and focus and the always-present `aria-describedby` description. This task builds no tooltip or description of its own.
- **Autosave:** `PageEditorAutoSave` (`Ui.TopBar.Element.createDecorator`, name `autoSave`, replaced in place) renders the base autosave only while `vm.allowsEditing`, so autosave is off while a review exists and while the status is loading or failed (defence in depth: the base autosave also refuses while the canvas is read-only). Other elements pass through untouched.
- **`PageEditorConfig`** (Task 22's rewrite) now also mounts `PageEditorAutoSave`, `PageBasePublishDecorator` and, inside the base config, `PageReviewPublishAction`.

**Files:**
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/DisabledPublishButton.tsx`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewPublishButton.tsx`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewPublishAction.tsx`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageBasePublishDecorator.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorAutoSave.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorConfig.tsx`
- Create tests: `src/Components/PageEditor/DisabledPublishButton.test.tsx`, `publishMatrix.test.tsx`, `PageEditorAutoSave.test.tsx`, `src/publishAutosave.wiring.test.tsx` (all under `packages/app-website-builder-workflows/`)
- Not touched here (deleted in Task 37): `PageFormWorkflowStatePublishButton.tsx`.

**Interfaces:**
- Consumes: Task 22 (`WbPageReviewFeature`, `PageEditorConfig`, `PageEditorLayout`, `pageEditorDocument.ts`, the test support `createFakeSession`, `createFakeVm`, `createPageEditor`, `WbEditorHarness`); Task 13 (`ITargetReviewViewModel.allowsEditing`, `allowsPublishing`, `publishDisabledReason`, `status`); existing Website Builder code, deep imports: `PublishButton` (`@webiny/app-website-builder/presentation/pages/PageEditor/TopBar/PublishButton.js`), `HasPermission` (`@webiny/app-website-builder/presentation/security/HasPermission.js`), `PageEditorConfig` with `Ui.TopBar.Action`, `Ui.TopBar.Element`, `Ui.IsNotReadOnly` (`.../presentation/pages/PageEditor/PageEditorConfig.js`), `useSelectFromDocument`, `WbPageStatus`; `Button` (`@webiny/admin-ui`, forwards `aria-*` through `...rest` after its own `aria-disabled={disabled}`), `ReviewTooltip` (`@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js`, Task 14, props `{ presenter; children }`); `@webiny/icons/publish.svg`.
- Produces: the `buttonWorkflowPublish` action, the `buttonPublish` decorator and the autosave gate; no export beyond the components.

**Test runner note:** admin package: `yarn test <path>` only (no `test:os`). Rendered `.svg` imports are mocked (`@webiny/icons/publish.svg`), `PublishButton` and `HasPermission` are mocked (the real ones need the page features and the permission container, which these tests do not exercise), and every test calls `cleanup()` in `afterEach`. `ReviewTooltip` is mocked to a span that exposes the presenter's `publishDisabledReason` as `data-reason` and renders its children (its own behaviour is tested in Task 14), so these tests assert the button (focusable, `aria-disabled`, no submit) and the reason it is given.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-website-builder-workflows/src/Components/PageEditor/DisabledPublishButton.test.tsx`:

```tsx
import React from "react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { DisabledPublishButton } from "./DisabledPublishButton.js";

vi.mock("@webiny/icons/publish.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock(
    "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js",
    async () => {
        const React = await import("react");
        interface StubProps {
            presenter: { vm: { publishDisabledReason: string | null } };
            children: React.ReactNode;
        }
        const ReviewTooltip = (props: StubProps) => {
            const reason = props.presenter.vm.publishDisabledReason ?? "";
            return React.createElement(
                "span",
                { "data-testid": "review-tooltip", "data-reason": reason },
                props.children
            );
        };
        return { ReviewTooltip };
    }
);

describe("DisabledPublishButton", () => {
    afterEach(() => {
        cleanup();
    });

    it("stays focusable: aria-disabled, never the disabled attribute", () => {
        const { presenter } = createFakeSession("none");

        render(<DisabledPublishButton presenter={presenter} />);

        const button = screen.getByRole("button", { name: "Publish" });
        expect(button.getAttribute("aria-disabled")).toBe("true");
        expect(button.hasAttribute("disabled")).toBe(false);
    });

    it("is wrapped in the shared review tooltip of the same presenter", () => {
        const { presenter } = createFakeSession("none");

        render(<DisabledPublishButton presenter={presenter} />);

        const button = screen.getByRole("button", { name: "Publish" });
        const tooltip = button.closest("[data-testid='review-tooltip']");
        expect(tooltip?.getAttribute("data-reason")).toBe("Publishing needs an approved review.");
    });

    it("does nothing when activated, not even a form submit", () => {
        const { presenter } = createFakeSession("none");
        const onSubmit = vi.fn();

        render(
            <form onSubmit={onSubmit}>
                <DisabledPublishButton presenter={presenter} />
            </form>
        );
        const button = screen.getByRole("button", { name: "Publish" });
        fireEvent.click(button);

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/publishMatrix.test.tsx` (the (review status x page status) table for Publish, the A73 case included):

```tsx
import React from "react";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { InternalPageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import type { FakeReviewKind } from "~tests/support/createFakeVm.js";
import { PageBasePublishDecorator } from "./PageBasePublishDecorator.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageReviewPublishAction } from "./PageReviewPublishAction.js";

vi.mock("@webiny/icons/publish.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageEditor/TopBar/PublishButton.js",
    async () => {
        const React = await import("react");
        const PublishButton = () => {
            return React.createElement("button", { "data-testid": "enabled-publish" }, "Publish");
        };
        return { PublishButton };
    }
);

vi.mock(
    "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js",
    async () => {
        const React = await import("react");
        interface StubProps {
            presenter: { vm: { publishDisabledReason: string | null } };
            children: React.ReactNode;
        }
        const ReviewTooltip = (props: StubProps) => {
            const reason = props.presenter.vm.publishDisabledReason ?? "";
            return React.createElement(
                "span",
                { "data-testid": "review-tooltip", "data-reason": reason },
                props.children
            );
        };
        return { ReviewTooltip };
    }
);

vi.mock("@webiny/app-website-builder/presentation/security/HasPermission.js", async () => {
    const React = await import("react");
    interface PassThroughProps {
        children: React.ReactNode;
    }
    const HasPermission = (props: PassThroughProps) => {
        return React.createElement(React.Fragment, null, props.children);
    };
    return { HasPermission };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

const { Ui } = PageEditorConfig;

const NEEDS_APPROVAL = "Publishing needs an approved review.";
const CHECKING = "Checking review status…";
const COULD_NOT_LOAD = "The review status could not be loaded. Try again from the review bar.";

interface PublishCase {
    kind: FakeReviewKind;
    page: WbStatus;
    base: boolean;
    enabled: boolean;
    disabledReason: string | null;
}

const MATRIX: PublishCase[] = [
    { kind: "loading", page: "draft", base: false, enabled: false, disabledReason: CHECKING },
    { kind: "loading", page: "published", base: false, enabled: false, disabledReason: null },
    { kind: "loading", page: "unpublished", base: false, enabled: false, disabledReason: CHECKING },
    { kind: "failed", page: "draft", base: false, enabled: false, disabledReason: COULD_NOT_LOAD },
    { kind: "failed", page: "published", base: false, enabled: false, disabledReason: null },
    {
        kind: "failed",
        page: "unpublished",
        base: false,
        enabled: false,
        disabledReason: COULD_NOT_LOAD
    },
    { kind: "noWorkflow", page: "draft", base: true, enabled: false, disabledReason: null },
    { kind: "noWorkflow", page: "published", base: false, enabled: false, disabledReason: null },
    { kind: "noWorkflow", page: "unpublished", base: false, enabled: false, disabledReason: null },
    { kind: "none", page: "draft", base: false, enabled: false, disabledReason: NEEDS_APPROVAL },
    { kind: "none", page: "published", base: false, enabled: false, disabledReason: null },
    {
        kind: "none",
        page: "unpublished",
        base: false,
        enabled: false,
        disabledReason: NEEDS_APPROVAL
    },
    {
        kind: "inProgress",
        page: "draft",
        base: false,
        enabled: false,
        disabledReason: NEEDS_APPROVAL
    },
    { kind: "inProgress", page: "published", base: false, enabled: false, disabledReason: null },
    {
        kind: "inProgress",
        page: "unpublished",
        base: false,
        enabled: false,
        disabledReason: NEEDS_APPROVAL
    },
    { kind: "approved", page: "draft", base: false, enabled: true, disabledReason: null },
    { kind: "approved", page: "published", base: false, enabled: false, disabledReason: null },
    { kind: "approved", page: "unpublished", base: false, enabled: true, disabledReason: null },
    { kind: "rejected", page: "draft", base: false, enabled: false, disabledReason: NEEDS_APPROVAL },
    { kind: "rejected", page: "published", base: false, enabled: false, disabledReason: null },
    {
        kind: "rejected",
        page: "unpublished",
        base: false,
        enabled: false,
        disabledReason: NEEDS_APPROVAL
    }
];

const mountPublish = (pageStatus: WbStatus, kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(pageStatus);

    render(
        <WbEditorHarness container={container} editor={editor} groups={["actions"]}>
            <PageEditorLayout />
            <Ui.Layout />
            <PageBasePublishDecorator />
            <InternalPageEditorConfig>
                <Ui.TopBar.Action name={"sentinel"} element={<span data-testid={"sentinel"} />} />
                <Ui.IsNotReadOnly>
                    <Ui.TopBar.Action
                        name={"buttonPublish"}
                        element={<span data-testid={"base-publish"} />}
                    />
                </Ui.IsNotReadOnly>
            </InternalPageEditorConfig>
            <PageEditorConfig>
                <PageReviewPublishAction />
            </PageEditorConfig>
        </WbEditorHarness>
    );

    return { ...handle, editor };
};

const getDisabledButtons = (): HTMLElement[] => {
    return Array.from(document.querySelectorAll<HTMLElement>("button[aria-disabled='true']"));
};

describe("Publish by review status and page status", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(MATRIX)("$kind review on a $page page", async ({
        kind,
        page,
        base,
        enabled,
        disabledReason
    }) => {
        mountPublish(page, kind);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("base-publish")).toHaveLength(base ? 1 : 0);
            expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(enabled ? 1 : 0);
            const disabled = getDisabledButtons();
            expect(disabled).toHaveLength(disabledReason ? 1 : 0);
        });

        const disabled = getDisabledButtons();
        if (disabledReason) {
            const tooltip = disabled[0].closest("[data-testid='review-tooltip']");
            expect(tooltip?.getAttribute("data-reason")).toBe(disabledReason);
        }
    });

    it("an approved, unpublished page shows an enabled Publish although the canvas is read-only", async () => {
        const { editor } = mountPublish("unpublished", "approved");
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(1);
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(true);
        expect(screen.queryAllByTestId("base-publish")).toHaveLength(0);
    });

    it("follows the review while the editor is open: approval turns the disabled Publish on", async () => {
        const { setKind } = mountPublish("draft", "inProgress");
        await screen.findByTestId("sentinel");
        await waitFor(() => {
            expect(getDisabledButtons()).toHaveLength(1);
        });

        act(() => {
            setKind("approved");
        });

        await waitFor(() => {
            expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(1);
        });
        expect(getDisabledButtons()).toHaveLength(0);
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorAutoSave.test.tsx`:

```tsx
import React from "react";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { InternalPageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import type { FakeReviewKind } from "~tests/support/createFakeVm.js";
import { PageEditorAutoSave } from "./PageEditorAutoSave.js";

const { Ui } = PageEditorConfig;

const mountAutoSave = (kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor("draft");

    render(
        <WbEditorHarness container={container} editor={editor} groups={["left"]}>
            <PageEditorAutoSave />
            <InternalPageEditorConfig>
                <Ui.TopBar.Element
                    group={"left"}
                    name={"sentinel"}
                    element={<span data-testid={"sentinel"} />}
                />
                <Ui.TopBar.Element
                    group={"left"}
                    name={"title"}
                    element={<span data-testid={"title"} />}
                />
                <Ui.TopBar.Element
                    group={"left"}
                    name={"autoSave"}
                    element={<span data-testid={"autosave"} />}
                />
            </InternalPageEditorConfig>
        </WbEditorHarness>
    );

    return handle;
};

interface AutoSaveCase {
    kind: FakeReviewKind;
    on: boolean;
}

const CASES: AutoSaveCase[] = [
    { kind: "loading", on: false },
    { kind: "failed", on: false },
    { kind: "noWorkflow", on: true },
    { kind: "none", on: true },
    { kind: "inProgress", on: false },
    { kind: "approved", on: false },
    { kind: "rejected", on: false }
];

describe("PageEditorAutoSave", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)("$kind review: autosave on is $on", async ({ kind, on }) => {
        mountAutoSave(kind);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(on ? 1 : 0);
        });
    });

    it("leaves every other top bar element alone", async () => {
        mountAutoSave("loading");
        await screen.findByTestId("sentinel");

        expect(screen.queryAllByTestId("title")).toHaveLength(1);
    });

    it("turns autosave off when a review starts and on again when it ends", async () => {
        const { setKind } = mountAutoSave("none");
        await screen.findByTestId("sentinel");
        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(1);
        });

        act(() => {
            setKind("inProgress");
        });
        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(0);
        });

        act(() => {
            setKind("none");
        });
        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(1);
        });
    });
});
```

Create `packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx` (composition root, flag on and off, R211):

```tsx
import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { InternalPageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: () => flags.enabled }) };
});

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/PagesList/index.js", () => {
    return { PagesList: () => null };
});

vi.mock("~/Components/OptionItem/index.js", () => {
    return { ListOpenInNewWindow: () => null };
});

vi.mock("@webiny/icons/publish.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageEditor/TopBar/PublishButton.js",
    async () => {
        const React = await import("react");
        const PublishButton = () => {
            return React.createElement("button", { "data-testid": "enabled-publish" }, "Publish");
        };
        return { PublishButton };
    }
);

vi.mock(
    "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js",
    async () => {
        const React = await import("react");
        interface StubProps {
            presenter: { vm: { publishDisabledReason: string | null } };
            children: React.ReactNode;
        }
        const ReviewTooltip = (props: StubProps) => {
            const reason = props.presenter.vm.publishDisabledReason ?? "";
            return React.createElement(
                "span",
                { "data-testid": "review-tooltip", "data-reason": reason },
                props.children
            );
        };
        return { ReviewTooltip };
    }
);

vi.mock("@webiny/app-website-builder/presentation/security/HasPermission.js", async () => {
    const React = await import("react");
    interface PassThroughProps {
        children: React.ReactNode;
    }
    const HasPermission = (props: PassThroughProps) => {
        return React.createElement(React.Fragment, null, props.children);
    };
    return { HasPermission };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

const { Ui } = PageEditorConfig;

const mountRoot = (enabled: boolean) => {
    flags.enabled = enabled;
    const handle = createFakeSession("inProgress");
    const container = new Container();
    container.registerInstance(TargetReviewPresenter, handle.presenter);
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    const editor = createPageEditor("draft");

    render(
        <WbEditorHarness container={container} editor={editor} groups={["left", "actions"]}>
            <WebsiteBuilderWorkflows />
            <Ui.Layout />
            <InternalPageEditorConfig>
                <Ui.TopBar.Action name={"sentinel"} element={<span data-testid={"sentinel"} />} />
                <Ui.IsNotReadOnly>
                    <Ui.TopBar.Action
                        name={"buttonPublish"}
                        element={<span data-testid={"base-publish"} />}
                    />
                </Ui.IsNotReadOnly>
                <Ui.TopBar.Element
                    group={"left"}
                    name={"autoSave"}
                    element={<span data-testid={"autosave"} />}
                />
            </InternalPageEditorConfig>
        </WbEditorHarness>
    );

    return handle;
};

describe("Website Builder publish and autosave rules from the composition root", () => {
    afterEach(() => {
        cleanup();
    });

    it("flag on: a review in progress hides the base Publish, shows a disabled one and stops autosave", async () => {
        mountRoot(true);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("base-publish")).toHaveLength(0);
            expect(screen.queryAllByTestId("autosave")).toHaveLength(0);
            const disabled = document.querySelectorAll("button[aria-disabled='true']");
            expect(disabled).toHaveLength(1);
        });
    });

    it("flag off: the base Publish and autosave are untouched and no workflows Publish exists", async () => {
        mountRoot(false);
        await screen.findByTestId("sentinel");

        expect(screen.queryAllByTestId("base-publish")).toHaveLength(1);
        expect(screen.queryAllByTestId("autosave")).toHaveLength(1);
        expect(document.querySelectorAll("button[aria-disabled='true']")).toHaveLength(0);
        expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(0);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/DisabledPublishButton.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/publishMatrix.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorAutoSave.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -50
```

Expected: `DisabledPublishButton.test.tsx` and `publishMatrix.test.tsx` FAIL to load (`Failed to resolve import "./DisabledPublishButton.js"`, `"./PageBasePublishDecorator.js"`). `PageEditorAutoSave.test.tsx` loads (the old file exists) and FAILS on behaviour: the old decorator reads the removed old presenter (`useWorkflowState`), so the gated cases fail (for example `inProgress review: autosave on is false` finds one autosave element, and the DI container has no old presenter). `publishAutosave.wiring.test.tsx` FAILS: with the flag on, `base-publish` is still present and no disabled Publish exists. Record this RED.

- [ ] **Step 3: Implement**

Create `packages/app-website-builder-workflows/src/Components/PageEditor/DisabledPublishButton.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import type { ITargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { ReviewTooltip } from "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";

export interface DisabledPublishButtonProps {
    presenter: ITargetReviewPresenter;
}

/**
 * A disabled Publish that stays focusable (QBZ-36): `aria-disabled` instead of the `disabled`
 * attribute and no click handler. The shared `ReviewTooltip` gives it the reason on hover and
 * focus and through `aria-describedby`.
 */
export const DisabledPublishButton = ({ presenter }: DisabledPublishButtonProps) => {
    return (
        <ReviewTooltip presenter={presenter}>
            <Button
                type={"button"}
                variant={"primary"}
                text={"Publish"}
                icon={<PublishIcon />}
                aria-disabled={"true"}
            />
        </ReviewTooltip>
    );
};
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewPublishButton.tsx`:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { PublishButton } from "@webiny/app-website-builder/presentation/pages/PageEditor/TopBar/PublishButton.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import { DisabledPublishButton } from "./DisabledPublishButton.js";
import type { IPageEditorDocument } from "./pageEditorDocument.js";

const selectStatus = (doc: IPageEditorDocument): WbStatus => {
    return doc.status || WbPageStatus.Draft;
};

/**
 * Publish for every namespace that has a workflow. It does not depend on the canvas being editable:
 * an approved revision is read-only and still publishes (A73).
 */
export const PageReviewPublishButton = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const pageStatus = useSelectFromDocument<WbStatus, IPageEditorDocument>(selectStatus);
    const { vm } = session.presenter;

    if (vm.status === "noWorkflow") {
        return null;
    }

    if (pageStatus === WbPageStatus.Published) {
        return null;
    }

    if (vm.allowsPublishing) {
        return <PublishButton />;
    }

    return <DisabledPublishButton presenter={session.presenter} />;
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewPublishAction.tsx`:

```tsx
import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { HasPermission } from "@webiny/app-website-builder/presentation/security/HasPermission.js";
import { PageReviewPublishButton } from "./PageReviewPublishButton.js";

const { Ui } = PageEditorConfig;

/**
 * Registered outside `Ui.IsNotReadOnly` on purpose: the base Publish is mounted only while the
 * canvas is editable, and an approved revision is read-only (A73).
 */
export const PageReviewPublishAction = () => {
    return (
        <Ui.TopBar.Action
            name={"buttonWorkflowPublish"}
            element={
                <HasPermission entity={"page"} action={"publish"}>
                    <PageReviewPublishButton />
                </HasPermission>
            }
        />
    );
};
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageBasePublishDecorator.tsx`:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface BasePublishGateProps {
    element?: React.ReactElement | null;
}

const BasePublishGate = createReactiveComponent((props: BasePublishGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);

    if (session.presenter.vm.status === "noWorkflow") {
        return props.element ?? null;
    }

    return null;
});

/**
 * Hides the base Publish for every page of a namespace that has a workflow; the workflows Publish
 * (`buttonWorkflowPublish`) takes over there. The one decoration of `buttonPublish` (A78).
 */
export const PageBasePublishDecorator = Ui.TopBar.Action.createDecorator(Original => {
    return function PageBasePublishDecoratorAction(props) {
        if (props.name === "buttonPublish") {
            return <Original {...props} element={<BasePublishGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
```

Rewrite `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorAutoSave.tsx` (the whole file):

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface AutoSaveGateProps {
    element?: React.ReactElement | null;
}

const AutoSaveGate = createReactiveComponent((props: AutoSaveGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);

    /**
     * Autosave runs only while editing is allowed: never while a review exists and never while the
     * review status is loading or failed.
     */
    if (session.presenter.vm.allowsEditing) {
        return props.element ?? null;
    }

    return null;
});

export const PageEditorAutoSave = Ui.TopBar.Element.createDecorator(Original => {
    return function PageEditorAutoSaveDecorated(props) {
        if (props.name === "autoSave") {
            return <Original {...props} element={<AutoSaveGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
```

Rewrite `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorConfig.tsx` (the whole file, Task 22's version plus this task's pieces; the base config is added here):

```tsx
import React from "react";
import { PageEditorConfig as BaseConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageEditorAutoSave } from "./PageEditorAutoSave.js";
import { PageBasePublishDecorator } from "./PageBasePublishDecorator.js";
import { PageReviewPublishAction } from "./PageReviewPublishAction.js";

export const PageEditorConfig = () => {
    return (
        <>
            {/* The review bar under the top bar, for every page status. */}
            <PageEditorTopBar />
            {/* The one source of the canvas read-only flag. */}
            <PageEditorLayout />
            {/* Autosave only while editing is allowed. */}
            <PageEditorAutoSave />
            {/* Hide the base Publish where a workflow exists. */}
            <PageBasePublishDecorator />
            <BaseConfig>
                {/* Publish that does not depend on the canvas being editable. */}
                <PageReviewPublishAction />
            </BaseConfig>
        </>
    );
};
```

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/DisabledPublishButton.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/publishMatrix.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorAutoSave.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -50
```

Expected: all PASS. A matrix row that is red for `base` usually means the sentinel resolved before the layout sync ran: the assertions are inside `waitFor`, so a persistent failure is a real rule error, not timing.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`PageEditorConfig` changed, so the whole editor shell suite from Task 22 runs again, one command per file:

```bash
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
yarn check:test:types -p app-website-builder-workflows --report cli 2>&1 | tail -40
```

Expected: all pass, no type errors. In `editorGlue.wiring.test.tsx` the root now also mounts the autosave decorator and the Publish action; they render nothing there because that test mounts no top bar elements.

- [ ] **Step 6: Pre-commit chain and commit**

Run `git status --short` first and stage only the files this task touches.

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
```

If any step fails and you fix anything, rerun the chain from the start. Then:

```bash
git commit -m "feat(app-website-builder-workflows): publish and autosave follow the review state" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

**Contract notes:**
- A73 chose the workflows `Ui.TopBar.Action` `buttonWorkflowPublish` plus one decorator hiding the base `buttonPublish` (reasons above). The contract's "base `buttonPublish` hidden for review states" is implemented as "hidden whenever the namespace has a workflow" (every status except `noWorkflow`): for `loading`, `failed` and `none` the base button would otherwise show beside the workflows one while the canvas is editable (`none`), and the workflows Publish must own the disabled states.
- QBZ-36 touch toggle, the reason tooltip and the hidden description are the shared `ReviewTooltip`'s (Task 14); this task adds no tooltip.
- Pending user decision (left as written): an unpublished page with no review and a workflow shows a disabled Publish ("Publishing needs an approved review.") where the base editor showed none (the canvas of an unpublished page is read-only). R226 gives `allowsPublishing` false for `none`, so the workflows button follows it; the base "New Revision" button is the way forward there.
- The `ReviewBar` itself, the `Request review` action and the Publish tooltip texts come from Tasks 13 and 14; the fake view model in `createFakeVm.ts` mirrors Task 13's `getEditorRules` reasons ("Checking review status…", "The review status could not be loaded. Try again from the review bar.", "Publishing needs an approved review."). If Task 13 words them differently, align the fixture, the tests need no other change.
- Verify at implementation time: `Button` really forwards an `aria-disabled` override through `...rest` (read in `packages/admin-ui/src/Button/Button.tsx`: `aria-disabled={disabled}` is set before `{...rest}`, so the override wins); `PublishButton` is exported by name from the deep path; `HasPermission` accepts `entity` and `action` exactly as in `DefaultPageEditorConfig.tsx`.
- Size: four test files, the matrix is 21 rows; the implementation is four small components and two rewrites.
