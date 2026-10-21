import { computed, makeAutoObservable, runInAction } from "mobx";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import {
    GetLayoutPreviewPageUseCase,
    getLayoutErrorMessage,
    type LayoutPreviewPageOption,
    ListLayoutPreviewPagesUseCase
} from "~/features/layouts/index.js";
import type { Editor } from "~/editorSdk/Editor.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import {
    LayoutPreviewPagePresenter as PresenterAbstraction,
    LayoutPreviewPageStorage
} from "./abstractions.js";

const optionLabel = (page: LayoutPreviewPageOption) => {
    const title = page.title || "Untitled";
    return page.path ? `${title} (${page.path})` : title;
};

class LayoutPreviewPagePresenterImpl implements PresenterAbstraction.Interface {
    private pages: LayoutPreviewPageOption[] = [];
    private selectedPageId: string | null = null;
    private loading = false;
    private editor: Editor<LayoutEditorDocument> | null = null;
    private entryId: string | null = null;
    // Bumped on every pick: a page load that finishes after another pick is ignored.
    private version = 0;

    constructor(
        private listPages: ListLayoutPreviewPagesUseCase.Interface,
        private getPage: GetLayoutPreviewPageUseCase.Interface,
        private storage: LayoutPreviewPageStorage.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<
            LayoutPreviewPagePresenterImpl,
            "editor" | "listPages" | "getPage" | "storage" | "notifications" | "version"
        >(
            this,
            {
                vm: computed,
                editor: false,
                version: false,
                listPages: false,
                getPage: false,
                storage: false,
                notifications: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        const options = this.pages.map(page => ({ label: optionLabel(page), value: page.id }));

        // A remembered page that isn't listed (yet) is still shown as picked.
        if (this.selectedPageId && !options.some(option => option.value === this.selectedPageId)) {
            options.unshift({ label: this.selectedPageId, value: this.selectedPageId });
        }

        return {
            options,
            selectedPageId: this.selectedPageId,
            loading: this.loading
        };
    }

    init(editor: Editor<LayoutEditorDocument>) {
        const document = editor.getDocumentState().read();
        this.editor = editor;
        this.entryId = document.entryId;
        this.pages = [];
        this.selectedPageId = null;

        const language = document.properties.language ?? null;
        void this.loadPages(language);

        const remembered = this.storage.get(document.entryId);
        if (remembered) {
            void this.select(remembered);
        }

        return () => {
            this.version++;
            this.editor = null;
        };
    }

    async select(pageId: string | null) {
        const editor = this.editor;
        const entryId = this.entryId;
        if (!editor || !entryId) {
            return;
        }

        const current = ++this.version;
        this.selectedPageId = pageId;
        this.storage.set(entryId, pageId);

        if (!pageId) {
            editor.updateDocument(document => {
                document.previewPage = null;
            });
            return;
        }

        this.loading = true;
        try {
            const page = await this.getPage.execute(pageId);
            if (current !== this.version) {
                return;
            }
            editor.updateDocument(document => {
                document.previewPage = {
                    id: page.id,
                    properties: page.properties,
                    elements: page.elements,
                    bindings: page.bindings
                };
            });
        } catch (error) {
            if (current !== this.version) {
                return;
            }
            // The page can't be previewed (e.g., it was deleted): forget it.
            runInAction(() => {
                this.selectedPageId = null;
            });
            this.storage.set(entryId, null);
            editor.updateDocument(document => {
                document.previewPage = null;
            });
            this.notifications.warning({
                title: "Could not load the page to preview the layout with",
                description: getLayoutErrorMessage(error)
            });
        } finally {
            runInAction(() => {
                if (current === this.version) {
                    this.loading = false;
                }
            });
        }
    }

    private async loadPages(language: string | null) {
        try {
            const pages = await this.listPages.execute(language);
            runInAction(() => {
                this.pages = pages;
            });
        } catch (error) {
            this.notifications.warning({
                title: "Could not list pages to preview the layout with",
                description: getLayoutErrorMessage(error)
            });
        }
    }
}

export const LayoutPreviewPagePresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: LayoutPreviewPagePresenterImpl,
    dependencies: [
        ListLayoutPreviewPagesUseCase,
        GetLayoutPreviewPageUseCase,
        LayoutPreviewPageStorage,
        Notifications
    ]
});
