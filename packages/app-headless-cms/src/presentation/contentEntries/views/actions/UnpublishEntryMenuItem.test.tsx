/**
 * @vitest-environment jsdom
 */
import React from "react";
import { observable, runInAction } from "mobx";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { UnpublishEntryMenuItem } from "./UnpublishEntryMenuItem.js";

interface EntryState {
    id: string;
    status: string;
}

interface Hoisted {
    canUnpublish: { current: boolean };
    entry: { current: { id: string; meta: { status: string } } | null };
    canUnpublishVm: { current: boolean };
}

const hoisted = vi.hoisted((): Hoisted => {
    return {
        canUnpublish: { current: true },
        entry: { current: null },
        canUnpublishVm: { current: true }
    };
});

interface ItemProps {
    label?: string;
    disabled?: boolean;
    onAction?: () => void;
}

vi.mock("@webiny/icons/visibility_off.svg", () => ({ ReactComponent: () => null }));

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        OptionsMenuItem: (props: ItemProps) => (
            <button disabled={props.disabled} onClick={props.onAction}>
                {props.label}
            </button>
        )
    };
});

vi.mock("~/admin/hooks/usePermission.js", () => ({
    usePermission: () => ({ canUnpublish: () => hoisted.canUnpublish.current })
}));

const state = observable<EntryState>({ id: "e#0001", status: "published" });
const patchEntryMeta: Mock = vi.fn((meta: { status: string }) => {
    runInAction(() => {
        state.status = meta.status;
    });
});
const unpublishRevision: Mock = vi.fn(async () => true);

vi.mock("~/presentation/contentEntries/form/useContentEntryFormPresenter.js", () => ({
    useContentEntryFormPresenter: () => ({
        vm: {
            get entry() {
                return { id: state.id, meta: { status: state.status } };
            },
            get canUnpublish() {
                return state.status === "published";
            },
            loading: null
        },
        patchEntryMeta
    })
}));

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return {
        ...actual,
        useFeature: () => ({ presenter: { unpublishRevision } })
    };
});

describe("UnpublishEntryMenuItem", () => {
    beforeEach(() => {
        hoisted.canUnpublish.current = true;
        runInAction(() => {
            state.status = "published";
        });
        unpublishRevision.mockClear();
        patchEntryMeta.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it("is shown for a published revision with the unpublish permission", () => {
        const view = render(<UnpublishEntryMenuItem />);
        expect(view.getByText("Unpublish")).toBeTruthy();
    });

    it("is hidden for a revision that is not published", () => {
        runInAction(() => {
            state.status = "draft";
        });
        const view = render(<UnpublishEntryMenuItem />);
        expect(view.queryByText("Unpublish")).toBeNull();
    });

    it("is hidden without the unpublish permission", () => {
        hoisted.canUnpublish.current = false;
        const view = render(<UnpublishEntryMenuItem />);
        expect(view.queryByText("Unpublish")).toBeNull();
    });

    it("unpublishes the revision and disappears once the entry is unpublished", async () => {
        const view = render(<UnpublishEntryMenuItem />);

        fireEvent.click(view.getByText("Unpublish"));

        await waitFor(() => expect(unpublishRevision).toHaveBeenCalledWith("e#0001"));
        await waitFor(() => expect(view.queryByText("Unpublish")).toBeNull());
        expect(patchEntryMeta).toHaveBeenCalledWith({ status: "unpublished" });
    });

    it("leaves the entry untouched when the unpublish is cancelled", async () => {
        unpublishRevision.mockResolvedValueOnce(false);
        const view = render(<UnpublishEntryMenuItem />);

        fireEvent.click(view.getByText("Unpublish"));

        await waitFor(() => expect(unpublishRevision).toHaveBeenCalled());
        expect(patchEntryMeta).not.toHaveBeenCalled();
        expect(view.getByText("Unpublish")).toBeTruthy();
    });
});
