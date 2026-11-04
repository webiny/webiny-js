import { compareStructural, reaction } from "mobx";
import type { EditorPage } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";
import { GetPageLayoutUseCase } from "~/features/layouts/getPageLayout/abstractions.js";
import { LayoutIdentity } from "~/domain/Layout/index.js";
import { PageLayoutPresenter as PresenterAbstraction } from "./abstractions.js";

class PageLayoutPresenterImpl implements PresenterAbstraction.Interface {
    constructor(private getPageLayout: GetPageLayoutUseCase.Interface) {}

    init(editor: Editor<EditorPage>) {
        // The layout that last failed to load, so clearing the shown layout doesn't load it again in a loop.
        let failedId: string | null = null;
        // Bumped on every change: a load that finishes after it is outdated, and ignored.
        let version = 0;

        const setLayout = (layout: EditorPage["layout"]) => {
            editor.updateDocument(document => {
                document.layout = layout;
            });
        };

        const sync = async (layoutId: string | null, loadedId: string | null) => {
            const current = ++version;

            if (layoutId === loadedId) {
                return;
            }

            if (!layoutId) {
                failedId = null;
                setLayout(null);
                return;
            }

            if (layoutId === failedId) {
                return;
            }

            try {
                // Pages are rendered in the layout's published version in their language, also in the editor.
                const language = editor.getDocumentState().read().properties.language || null;
                const layout = await this.getPageLayout.execute(layoutId, language);
                if (current !== version) {
                    return;
                }
                if (!layout) {
                    failedId = layoutId;
                    setLayout(null);
                    return;
                }
                failedId = null;
                setLayout({
                    id: layout.id,
                    entryId: layout.entryId,
                    properties: layout.properties,
                    elements: layout.elements,
                    bindings: layout.bindings
                });
            } catch {
                if (current !== version) {
                    return;
                }
                failedId = layoutId;
                setLayout(null);
            }
        };

        const dispose = reaction(
            () => {
                const document = editor.getDocumentState().read();
                return {
                    layoutId: document.properties.layout || null,
                    // Pages reference a layout by its source's entry id.
                    loadedId: document.layout
                        ? LayoutIdentity.from(document.layout).sourceId()
                        : null
                };
            },
            ({ layoutId, loadedId }) => void sync(layoutId, loadedId),
            { fireImmediately: true, equals: compareStructural }
        );

        return () => {
            version++;
            dispose();
        };
    }
}

export const PageLayoutPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: PageLayoutPresenterImpl,
    dependencies: [GetPageLayoutUseCase]
});
