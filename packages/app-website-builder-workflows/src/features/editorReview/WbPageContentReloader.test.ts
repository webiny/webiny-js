import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import type { ElementMap } from "@webiny/website-builder-sdk";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";
import { WbPageContentReloader } from "./WbPageContentReloader.js";

const PAGE_ID = "page-1#0001";
const SAVED = "2026-10-17T10:00:00.000Z";
const SAVED_LATER = "2026-10-17T11:00:00.000Z";
const MODIFIED = "2026-10-17T10:30:00.000Z";
const MODIFIED_LATER = "2026-10-17T11:30:00.000Z";

const ROOT: DocumentElement = {
    type: "Webiny/Element",
    id: "root",
    component: { name: "Webiny/Box" }
};
const HERO: DocumentElement = {
    type: "Webiny/Element",
    id: "hero",
    component: { name: "Webiny/Heading" },
    parent: { id: "root", slot: "children" }
};
const OLD_ELEMENTS: ElementMap = { root: ROOT };
const NEW_ELEMENTS: ElementMap = { root: ROOT, hero: HERO };

interface FakeGetPage {
    execute: ReturnType<typeof vi.fn>;
}

function createPage(overrides: Partial<Parameters<typeof Page.create>[0]> = {}): Page {
    return Page.create({
        id: PAGE_ID,
        entryId: "page-1",
        status: WbPageStatus.Draft,
        properties: { title: "Home" },
        elements: OLD_ELEMENTS,
        savedOn: SAVED,
        modifiedOn: MODIFIED,
        ...overrides
    });
}

function createEditor(overrides: Partial<IPageEditorDocument> = {}): Editor<IPageEditorDocument> {
    const document: IPageEditorDocument = {
        id: PAGE_ID,
        status: WbPageStatus.Draft,
        version: 1,
        state: {},
        properties: { title: "Home" },
        extensions: {},
        metadata: {},
        bindings: {},
        elements: OLD_ELEMENTS,
        savedOn: SAVED,
        modifiedOn: MODIFIED,
        ...overrides
    };

    return new Editor<IPageEditorDocument>(document, { isReadOnly: true });
}

describe("WbPageContentReloader", () => {
    let cache: ListCache<Page>;
    let editor: Editor<IPageEditorDocument>;
    let getPage: FakeGetPage;
    let reloader: WbPageContentReloader;
    let cachedWhenRead: Page | undefined;

    beforeEach(() => {
        cache = new ListCache<Page>("id");
        cache.addItems([createPage(), createPage({ id: "page-2#0001", entryId: "page-2" })]);
        editor = createEditor();
        cachedWhenRead = undefined;
        getPage = {
            execute: vi.fn(async (_params: GetPageUseCase.Params) => {
                cachedWhenRead = cache.getItem(page => page.id === PAGE_ID);
                return createPage({ savedOn: SAVED_LATER, elements: NEW_ELEMENTS });
            })
        };
        reloader = new WbPageContentReloader(
            editor,
            cache,
            getPage as unknown as GetPageUseCase.Interface
        );
    });

    it("evicts the page from the full page cache before it reads it (A96)", async () => {
        await reloader.reload();

        expect(getPage.execute).toHaveBeenCalledTimes(1);
        expect(getPage.execute).toHaveBeenCalledWith({ id: PAGE_ID });
        expect(cachedWhenRead).toBeUndefined();
    });

    it("keeps the other cached pages", async () => {
        await reloader.reload();

        const other = cache.getItem(page => page.id === "page-2#0001");
        expect(other).toBeDefined();
    });

    it("applies the reloaded content with updateDocument and returns true when savedOn changed", async () => {
        const changed = await reloader.reload();

        expect(changed).toBe(true);
        const document = editor.getDocumentState().read();
        expect(document.elements).toEqual(NEW_ELEMENTS);
        expect(document.savedOn).toBe(SAVED_LATER);
        expect(document.modifiedOn).toBe(MODIFIED);
        expect(document.id).toBe(PAGE_ID);
        expect(document.status).toBe(WbPageStatus.Draft);
    });

    it("returns true when only modifiedOn changed", async () => {
        getPage.execute.mockImplementation(async () => {
            return createPage({ modifiedOn: MODIFIED_LATER, elements: NEW_ELEMENTS });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(true);
        expect(editor.getDocumentState().read().modifiedOn).toBe(MODIFIED_LATER);
    });

    it("returns false and leaves the editor alone when the timestamps are the same", async () => {
        getPage.execute.mockImplementation(async () => {
            return createPage({ elements: NEW_ELEMENTS });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(editor.getDocumentState().read().elements).toEqual(OLD_ELEMENTS);
    });

    it("compares with the cached page when it is cached, not with the stale document", async () => {
        cache.removeItems(page => page.id === PAGE_ID);
        cache.addItems([createPage({ savedOn: SAVED_LATER })]);
        getPage.execute.mockImplementation(async () => {
            return createPage({ savedOn: SAVED_LATER, elements: NEW_ELEMENTS });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(editor.getDocumentState().read().elements).toEqual(OLD_ELEMENTS);
    });

    it("compares with the editor document when the page is not cached", async () => {
        cache.clear();

        const changed = await reloader.reload();

        expect(changed).toBe(true);
    });

    it("treats a missing modifiedOn of the document like the empty string Page.create uses", async () => {
        cache.clear();
        editor = createEditor({ modifiedOn: null });
        reloader = new WbPageContentReloader(
            editor,
            cache,
            getPage as unknown as GetPageUseCase.Interface
        );
        getPage.execute.mockImplementation(async () => {
            return createPage({ modifiedOn: "" });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
    });

    it("lets a failed read reject and leaves the editor alone", async () => {
        const failure = new Error("Network down");
        getPage.execute.mockRejectedValue(failure);

        const error = await reloader.reload().catch(e => e);

        expect(error).toBe(failure);
        expect(editor.getDocumentState().read().elements).toEqual(OLD_ELEMENTS);
    });
});
