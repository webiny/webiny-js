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
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
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
            children: (describedBy: string) => React.ReactNode;
        }
        const ReviewTooltip = (props: StubProps) => {
            const reason = props.presenter.vm.publishDisabledReason ?? "";
            return React.createElement(
                "span",
                { "data-testid": "review-tooltip", "data-reason": reason },
                props.children("tooltip-description")
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

interface PublishCase {
    kind: FakeReviewKind;
    page: WbStatus;
    base: boolean;
    enabled: boolean;
    disabled: boolean;
}

/**
 * `base` is the base Publish (only for a workflow-less namespace on an editable canvas), `enabled` the
 * workflows Publish that publishes, `disabled` the focusable disabled one. The reasons are not
 * repeated here: they come from the real `getEditorRules` through the fixture and are pinned by Task 13.
 */
const MATRIX: PublishCase[] = [
    { kind: "loading", page: "draft", base: false, enabled: false, disabled: true },
    { kind: "loading", page: "published", base: false, enabled: false, disabled: false },
    { kind: "loading", page: "unpublished", base: false, enabled: false, disabled: true },
    { kind: "failed", page: "draft", base: false, enabled: false, disabled: true },
    { kind: "failed", page: "published", base: false, enabled: false, disabled: false },
    { kind: "failed", page: "unpublished", base: false, enabled: false, disabled: true },
    { kind: "noWorkflow", page: "draft", base: true, enabled: false, disabled: false },
    { kind: "noWorkflow", page: "published", base: false, enabled: false, disabled: false },
    { kind: "noWorkflow", page: "unpublished", base: false, enabled: false, disabled: false },
    { kind: "none", page: "draft", base: false, enabled: false, disabled: true },
    { kind: "none", page: "published", base: false, enabled: false, disabled: false },
    { kind: "none", page: "unpublished", base: false, enabled: true, disabled: false },
    { kind: "inProgress", page: "draft", base: false, enabled: false, disabled: true },
    { kind: "inProgress", page: "published", base: false, enabled: false, disabled: false },
    { kind: "inProgress", page: "unpublished", base: false, enabled: false, disabled: true },
    { kind: "approved", page: "draft", base: false, enabled: true, disabled: false },
    { kind: "approved", page: "published", base: false, enabled: false, disabled: false },
    { kind: "approved", page: "unpublished", base: false, enabled: true, disabled: false },
    { kind: "rejected", page: "draft", base: false, enabled: false, disabled: true },
    { kind: "rejected", page: "published", base: false, enabled: false, disabled: false },
    { kind: "rejected", page: "unpublished", base: false, enabled: false, disabled: true }
];

const mountPublish = (pageStatus: WbStatus, kind: FakeReviewKind) => {
    const handle = createFakeSession(kind, pageStatus === "unpublished");
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

    it.each(MATRIX)(
        "$kind review on a $page page",
        async ({ kind, page, base, enabled, disabled }) => {
            const { presenter } = mountPublish(page, kind);
            await screen.findByTestId("sentinel");

            await waitFor(() => {
                expect(screen.queryAllByTestId("base-publish")).toHaveLength(base ? 1 : 0);
                expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(enabled ? 1 : 0);
                expect(getDisabledButtons()).toHaveLength(disabled ? 1 : 0);
            });

            if (disabled) {
                const button = getDisabledButtons()[0];
                const tooltip = button.closest("[data-testid='review-tooltip']");
                const reason = presenter.vm.publishDisabledReason;
                expect(reason).not.toBeNull();
                expect(tooltip?.getAttribute("data-reason")).toBe(reason);
            }
        }
    );

    it("an approved, unpublished page shows an enabled Publish although the canvas is read-only", async () => {
        const { editor } = mountPublish("unpublished", "approved");
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(1);
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(true);
        expect(screen.queryAllByTestId("base-publish")).toHaveLength(0);
    });

    it("an unpublished page with no review shows an enabled Publish: it was reviewed before it was published (Q19)", async () => {
        const { editor } = mountPublish("unpublished", "none");
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("enabled-publish")).toHaveLength(1);
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(true);
        expect(getDisabledButtons()).toHaveLength(0);
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
