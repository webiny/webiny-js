/**
 * @vitest-environment jsdom
 */
import React from "react";
import { observable, runInAction } from "mobx";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { ContentEntryFormView } from "./ContentEntryFormView.js";

interface ListState {
    selectedEntryId: string | null;
}

interface Hoisted {
    wizard: { current: unknown };
}

const hoisted = vi.hoisted((): Hoisted => ({ wizard: { current: undefined } }));

const list = observable<ListState>({ selectedEntryId: "e1" });
const newEntry: Mock = vi.fn();
const setFolderId: Mock = vi.fn();

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return { ...actual, useRouter: () => ({ goToRoute: vi.fn() }) };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useRoute: () => ({ route: { params: {} } }) };
});

vi.mock("~/admin/config/contentEntries/index.js", () => ({
    useContentEntryEditorConfig: () => ({ newEntryWizard: hoisted.wizard.current })
}));

vi.mock("~/presentation/contentEntries/list/useContentEntriesPresenter.js", () => ({
    useContentEntriesPresenter: () => ({
        vm: {
            get selectedEntryId() {
                return list.selectedEntryId;
            },
            model: { name: "Article" }
        },
        folders: { vm: { currentFolderId: "folder-1" } }
    })
}));

vi.mock("~/presentation/contentEntries/form/useContentEntryFormPresenter.js", () => ({
    useContentEntryFormPresenter: () => ({ newEntry, setFolderId })
}));

vi.mock("./ContentEntryEditorBody.js", () => ({
    ContentEntryEditorBody: ({ entryId }: { entryId: string | null }) => <div>{entryId}</div>
}));

describe("ContentEntryFormView", () => {
    beforeEach(() => {
        hoisted.wizard.current = undefined;
        runInAction(() => {
            list.selectedEntryId = "e1";
        });
        newEntry.mockClear();
        setFolderId.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it("leaves the form alone while an existing entry is selected", () => {
        render(<ContentEntryFormView />);

        expect(newEntry).not.toHaveBeenCalled();
        expect(setFolderId).not.toHaveBeenCalled();
    });

    it("starts a new entry in the current folder when switching from an entry to new", () => {
        render(<ContentEntryFormView />);

        act(() => {
            runInAction(() => {
                list.selectedEntryId = "new";
            });
        });

        expect(setFolderId).toHaveBeenCalledWith("folder-1");
        expect(newEntry).toHaveBeenCalledTimes(1);
    });

    it("sets the folder but leaves the entry to the wizard when one is configured", () => {
        hoisted.wizard.current = () => null;
        render(<ContentEntryFormView />);

        act(() => {
            runInAction(() => {
                list.selectedEntryId = "new";
            });
        });

        expect(setFolderId).toHaveBeenCalledWith("folder-1");
        expect(newEntry).not.toHaveBeenCalled();
    });
});
