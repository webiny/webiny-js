import { compareStructural, reaction, runInAction, toJS } from "mobx";
import type {
    DocumentBindings,
    EditorDocument,
    EditorPage,
    GlobalComponentRecord,
    GlobalDocument,
    PageLayout
} from "@webiny/website-builder-sdk";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { SaveGlobalComponentUseCase } from "~/features/globals/saveGlobalComponent/abstractions.js";
import {
    GlobalComponentsPresenterBase,
    toRecords
} from "~/presentation/globals/overrides/GlobalComponentsPresenterBase.js";
import {
    OverrideLayers,
    splitStoredOverrides
} from "~/presentation/globals/overrides/OverrideLayers.js";
import { PageGlobalComponentsPresenter as PresenterAbstraction } from "./abstractions.js";

/**
 * The layout's own elements, which the page can override. The layout's root (and any id the page also has)
 * stays the page's: the page renders its own root in the layout's main content area.
 */
const getLayoutElementIds = (
    layout: PageLayout | null | undefined,
    pageElements: Record<string, unknown>
) => {
    return Object.keys(layout?.elements ?? {}).filter(id => id !== "root" && !pageElements[id]);
};

// The layout's bindings, with those of its elements as the page shows them (with the page's overrides).
const withLayoutElementBindings = (
    layoutBindings: DocumentBindings,
    pageBindings: DocumentBindings,
    layoutElementIds: string[]
) => {
    const bindings = { ...layoutBindings };
    layoutElementIds.forEach(id => {
        if (pageBindings[id]) {
            bindings[id] = structuredClone(pageBindings[id]);
        }
    });
    return bindings;
};

class PageGlobalComponentsPresenterImpl
    extends GlobalComponentsPresenterBase
    implements PresenterAbstraction.Interface
{
    protected readonly documentType = "page" as const;

    constructor(
        saveGlobalComponent: SaveGlobalComponentUseCase.Interface,
        notifications: Notifications.Interface
    ) {
        super(saveGlobalComponent, notifications);
    }

    prepare(page: EditorPage, records: GlobalComponentRecord[] | null): EditorPage {
        const layoutElementIds = getLayoutElementIds(page.layout, page.elements);
        const { document, own } = splitStoredOverrides(page, layoutElementIds);

        if (!records) {
            this.notifications.warning({
                title: "Could not load the global components",
                description:
                    "They show their defaults, and can't be saved in the global component until the editor is reloaded."
            });
        }

        const layers = new OverrideLayers({
            records: toRecords(records ?? []),
            layoutBindings: structuredClone(page.layout?.bindings ?? {}),
            layoutElementIds,
            own
        });

        const composed: GlobalDocument = structuredClone(document);
        layers.composeLayoutElements(composed, document.bindings);
        Object.keys(layers.data.records).forEach(globalId => {
            layers.composeGlobal(composed, globalId);
        });

        runInAction(() => {
            this.layers = layers;
            this.loaded = true;
            this.listed = records !== null;
        });

        return {
            ...page,
            elements: composed.elements,
            bindings: composed.bindings,
            layout: page.layout
                ? {
                      ...page.layout,
                      bindings: withLayoutElementBindings(
                          page.layout.bindings,
                          composed.bindings,
                          layoutElementIds
                      )
                  }
                : page.layout
        };
    }

    /**
     * When another layout is picked in the page settings, its elements replace the old layout's: the page's
     * overrides of the old layout's elements go, and globals get the new layout's overrides.
     */
    protected track(editor: Editor<EditorDocument>) {
        // Every document update commits a new copy of the document: follow the layout by its revision.
        const offLayout = reaction(
            () => editor.getDocumentState().read().layout?.id ?? null,
            () => {
                const layout = editor.getDocumentState().read().layout;
                this.applyLayout(editor, layout ? toJS(layout) : null);
            }
        );

        // The sidebar edits a layout element's inputs in the page's bindings, where the page's override of
        // it is kept. The preview renders the layout as it comes: with the page's overrides in it.
        const offPreview = reaction(
            () => {
                const bindings = editor.getDocumentState().read().bindings;
                return this.layers.data.layoutElementIds.map(
                    id => [id, toJS(bindings[id])] as [string, DocumentBindings[string] | undefined]
                );
            },
            entries => {
                editor.updateDocument(document => {
                    if (!document.layout) {
                        return;
                    }
                    for (const [id, bindings] of entries) {
                        if (bindings) {
                            document.layout.bindings[id] = structuredClone(bindings);
                        }
                    }
                });
            },
            { equals: compareStructural }
        );

        return () => {
            offLayout();
            offPreview();
        };
    }

    private applyLayout(editor: Editor<EditorDocument>, layout: PageLayout | null) {
        const previousIds = this.layers.data.layoutElementIds;
        const layoutElementIds = getLayoutElementIds(
            layout,
            editor.getDocumentState().read().elements
        );

        runInAction(() => {
            this.layers = this.layers.with({
                layoutBindings: layout?.bindings ?? {},
                layoutElementIds
            });
        });

        editor.updateDocument(document => {
            previousIds.forEach(id => {
                if (!document.elements[id]) {
                    delete document.bindings[id];
                }
            });

            const plain = document as unknown as GlobalDocument;
            this.layers.composeLayoutElements(plain, {});
            Object.keys(this.layers.data.records).forEach(globalId => {
                this.layers.composeGlobal(plain, globalId);
            });
        });
    }
}

export const PageGlobalComponentsPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: PageGlobalComponentsPresenterImpl,
    dependencies: [SaveGlobalComponentUseCase, Notifications]
});
