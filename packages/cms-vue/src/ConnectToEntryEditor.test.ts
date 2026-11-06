// @vitest-environment happy-dom
import { createApp } from "vue";
import { h } from "vue";
import { nextTick } from "vue";
import { ref } from "vue";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { afterEach } from "vitest";
import { contentSdk } from "@webiny/cms-sdk";
import { entryStoreManager } from "@webiny/cms-sdk";
import type { CmsEntry } from "@webiny/cms-sdk";
import { ConnectToEntryEditor } from "./ConnectToEntryEditor.js";

const createEntry = (entryId: string): CmsEntry => ({
    id: `${entryId}#0001`,
    entryId,
    values: { title: entryId }
});

describe("ConnectToEntryEditor", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        entryStoreManager.removeStore("first#0001");
        entryStoreManager.removeStore("second#0001");
    });

    it("does not hand the previous entry to the store of a new entry ID", async () => {
        const pending = new Map<string, (entry: CmsEntry) => void>();
        vi.spyOn(contentSdk, "getEntry").mockImplementation(params => {
            return new Promise(resolve => pending.set(params.entryId, resolve as never));
        });

        const entryId = ref("first#0001");
        const el = document.createElement("div");
        const app = createApp({
            render: () =>
                h(ConnectToEntryEditor, { modelId: "article", entryId: entryId.value }, () =>
                    h("span", "content")
                )
        });
        app.mount(el);

        pending.get("first#0001")?.(createEntry("first"));
        await vi.waitFor(() => expect(el.innerHTML).toBe("<span>content</span>"));

        entryId.value = "second#0001";
        await nextTick();

        const secondStore = entryStoreManager.getStore("second#0001");
        expect(secondStore.getEntry()).toBeNull();
        expect(el.innerHTML).not.toContain("content");

        pending.get("second#0001")?.(createEntry("second"));
        await vi.waitFor(() => expect(secondStore.getEntry()?.entryId).toBe("second"));

        app.unmount();
    });
});
