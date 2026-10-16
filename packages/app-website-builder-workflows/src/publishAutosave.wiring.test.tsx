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
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
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

vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
    return { WbContentReviews: () => null };
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

const mountRoot = (enabled: boolean, kind: FakeReviewKind = "inProgress") => {
    flags.enabled = enabled;
    const handle = createFakeSession(kind);
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
                <Ui.TopBar.Action
                    name={"buttonNewRevision"}
                    element={<span data-testid={"new-revision"} />}
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

    it("flag on: New Revision is hidden while a review is in progress", async () => {
        mountRoot(true, "inProgress");
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(0);
        });
        expect(screen.queryAllByTestId("new-revision")).toHaveLength(0);
    });

    it("flag on: New Revision is shown for a rejected review", async () => {
        mountRoot(true, "rejected");
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(1);
        });
    });

    it("flag off: New Revision is untouched", async () => {
        mountRoot(false, "inProgress");
        await screen.findByTestId("sentinel");

        expect(screen.queryAllByTestId("new-revision")).toHaveLength(1);
    });
});
