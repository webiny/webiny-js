import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor.js";
import { GetPageLayoutUseCase } from "~/features/layouts/getPageLayout/abstractions.js";
import { PageLayoutPresenter } from "./abstractions.js";
import { PageLayoutPresenterRegistration } from "./PageLayoutPresenter.js";

// Document state updates are committed in a microtask.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// A published revision of a source layout: pages reference it by the source's entry id.
const createLayout = (id: string): any => ({
    id: `${id}#0001`,
    entryId: id,
    properties: { title: id },
    elements: {
        [`${id}-root`]: { type: "Webiny/Element", id: `${id}-root`, component: { name: "Root" } }
    },
    bindings: {}
});

const createEditor = (layoutId: string | null, layout: EditorPage["layout"] = null) => {
    return new Editor<EditorPage>({
        properties: { layout: layoutId },
        metadata: {},
        extensions: {},
        elements: {},
        bindings: {},
        layout
    } as any);
};

const pickLayout = (editor: Editor<EditorPage>, layoutId: string | null) => {
    editor.updateDocument(document => {
        document.properties.layout = layoutId;
    });
};

const shownLayoutId = (editor: Editor<EditorPage>) => {
    return editor.getDocumentState().read().layout?.entryId ?? null;
};

describe("PageLayoutPresenter", () => {
    const getLayout = { execute: vi.fn() };
    let presenter: PageLayoutPresenter.Interface;

    beforeEach(() => {
        vi.clearAllMocks();
        getLayout.execute.mockImplementation(async (id: string) => createLayout(id));

        const container = new Container();
        container.registerInstance(GetPageLayoutUseCase, getLayout as any);
        container.register(PageLayoutPresenterRegistration);
        presenter = container.resolve(PageLayoutPresenter);
    });

    it("keeps the layout the page was delivered with", async () => {
        const editor = createEditor("a", createLayout("a"));
        presenter.init(editor);
        await flush();

        expect(getLayout.execute).not.toHaveBeenCalled();
        expect(shownLayoutId(editor)).toBe("a");
    });

    it("loads a newly picked layout, and clears it when none is picked", async () => {
        const editor = createEditor(null);
        presenter.init(editor);

        pickLayout(editor, "b");
        await flush();
        await flush();
        expect(getLayout.execute).toHaveBeenCalledWith("b", null);
        expect(shownLayoutId(editor)).toBe("b");

        pickLayout(editor, null);
        await flush();
        await flush();
        expect(shownLayoutId(editor)).toBeNull();
    });

    it("renders a layout without a published version as none, and doesn't load it again", async () => {
        getLayout.execute.mockResolvedValue(null);
        const editor = createEditor("draft-only");
        presenter.init(editor);
        await flush();
        await flush();

        expect(shownLayoutId(editor)).toBeNull();
        expect(getLayout.execute).toHaveBeenCalledTimes(1);
    });

    it("loads the layout in the page's language", async () => {
        const editor = new Editor<EditorPage>({
            properties: { layout: "a", language: "de" },
            metadata: {},
            extensions: {},
            elements: {},
            bindings: {},
            layout: null
        } as any);
        presenter.init(editor);
        await flush();
        await flush();

        expect(getLayout.execute).toHaveBeenCalledWith("a", "de");
    });

    it("renders a layout that can't be loaded as none, and doesn't load it again", async () => {
        getLayout.execute.mockRejectedValue(new Error("Not found"));
        const editor = createEditor("missing");
        presenter.init(editor);
        await flush();
        await flush();

        expect(shownLayoutId(editor)).toBeNull();
        expect(getLayout.execute).toHaveBeenCalledTimes(1);
    });

    it("ignores a load that finishes after another layout was picked", async () => {
        let resolveSlow: (layout: any) => void = () => {};
        getLayout.execute.mockImplementation((id: string) => {
            if (id === "slow") {
                return new Promise(resolve => (resolveSlow = resolve));
            }
            return Promise.resolve(createLayout(id));
        });

        const editor = createEditor("slow");
        presenter.init(editor);

        pickLayout(editor, "fast");
        await flush();
        await flush();
        expect(shownLayoutId(editor)).toBe("fast");

        resolveSlow(createLayout("slow"));
        await flush();
        await flush();
        expect(shownLayoutId(editor)).toBe("fast");
    });

    it("stops once disposed", async () => {
        const editor = createEditor(null);
        const dispose = presenter.init(editor);
        dispose();

        pickLayout(editor, "b");
        await flush();
        await flush();
        expect(getLayout.execute).not.toHaveBeenCalled();
    });
});
