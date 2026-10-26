import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { CmsEntryReviewNewRevision } from "./CmsEntryReviewNewRevision.js";
import { NO_PUBLISHING_MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { createEntry } from "~/testing/createEntry.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { REJECTED } from "~/testing/reviewStates.js";

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
    onAction: () => void;
}

const mocks = vi.hoisted(() => {
    return { canEdit: true, setRouteParams: vi.fn(), showWarningToast: vi.fn() };
});

vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();

    return {
        ...actual,
        useToast: () => {
            return { showWarningToast: mocks.showWarningToast };
        }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement(
                "button",
                {
                    "data-testid": "menu-item",
                    disabled: props.disabled ?? false,
                    onClick: props.onAction
                },
                props.label
            );
        }
    };
});

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();

    return {
        ...actual,
        useRoute: () => {
            return { setRouteParams: mocks.setRouteParams };
        }
    };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return { canEdit: () => mocks.canEdit, canPublish: () => true };
        }
    };
});

function renderMenu(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({ ...params, children: <CmsEntryReviewNewRevision /> });
}

describe("CmsEntryReviewNewRevision", () => {
    beforeEach(() => {
        mocks.canEdit = true;
        mocks.setRouteParams.mockReset();
        mocks.showWarningToast.mockReset();
    });

    it("is registered as the createNewRevision menu item", async () => {
        renderMenu({ reviewVm: NO_WORKFLOW });

        const item = await screen.findByTestId("menu-item");

        expect(item.textContent).toBe("Create New Revision");
        expect(item.closest("[data-action]")?.getAttribute("data-action")).toBe(
            "createNewRevision"
        );
    });

    it.each([
        ["no workflow", NO_WORKFLOW],
        ["no active review", BOUND_NO_REVIEW],
        ["a review in progress", IN_REVIEW],
        ["a rejected review", REJECTED],
        ["an approved review", APPROVED]
    ])("is enabled for %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        const item = await screen.findByTestId("menu-item");

        expect(item.hasAttribute("disabled")).toBe(false);
    });

    it.each([
        ["loading", LOADING],
        ["failed", FAILED]
    ])("is disabled while the status is %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        const item = await screen.findByTestId("menu-item");

        expect(item.hasAttribute("disabled")).toBe(true);
    });

    it("stays enabled for a singleton model whatever the shared presenter holds", async () => {
        renderMenu({ formVm: { model: SINGLETON_MODEL }, reviewVm: LOADING });

        const item = await screen.findByTestId("menu-item");

        expect(item.hasAttribute("disabled")).toBe(false);
    });

    it("renders nothing without an entry", async () => {
        renderMenu({ formVm: { entry: null, isNewEntry: true }, reviewVm: NO_WORKFLOW });

        await screen.findByTestId("menu-actions");
        await waitFor(() => expect(screen.queryByTestId("menu-item")).toBeNull());
    });

    it("renders nothing without edit permission", async () => {
        mocks.canEdit = false;
        renderMenu({ reviewVm: NO_WORKFLOW });

        await screen.findByTestId("menu-actions");
        await waitFor(() => expect(screen.queryByTestId("menu-item")).toBeNull());
    });

    it("renders nothing for a model that cannot publish", async () => {
        renderMenu({ formVm: { model: NO_PUBLISHING_MODEL }, reviewVm: NO_WORKFLOW });

        await screen.findByTestId("menu-actions");
        await waitFor(() => expect(screen.queryByTestId("menu-item")).toBeNull());
    });

    it("creates the revision and moves the route to it", async () => {
        const view = renderMenu({ reviewVm: REJECTED });
        const created = createEntry();
        created.id = "entry-1#0002";
        vi.mocked(view.revisions.createRevision).mockResolvedValue(created);

        fireEvent.click(await screen.findByTestId("menu-item"));

        await waitFor(() => expect(mocks.setRouteParams).toHaveBeenCalledTimes(1));
        expect(view.revisions.createRevision).toHaveBeenCalledWith("entry-1#0001");
        const update = mocks.setRouteParams.mock.calls[0][0];
        expect(update({ modelId: "article", id: "entry-1#0001" })).toEqual({
            modelId: "article",
            id: "entry-1#0002"
        });
    });

    it("warns and stays on the revision when the new revision could not be created", async () => {
        const view = renderMenu({ reviewVm: REJECTED });
        vi.mocked(view.revisions.createRevision).mockResolvedValue(null);

        fireEvent.click(await screen.findByTestId("menu-item"));

        await waitFor(() => expect(mocks.showWarningToast).toHaveBeenCalledTimes(1));
        expect(mocks.showWarningToast).toHaveBeenCalledWith({
            title: "Could not create a new revision."
        });
        expect(mocks.setRouteParams).not.toHaveBeenCalled();
    });
});
