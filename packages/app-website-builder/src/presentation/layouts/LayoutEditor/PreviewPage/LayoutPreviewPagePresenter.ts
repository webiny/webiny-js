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

// Search once typing pauses for this long.
export const SEARCH_DELAY_MS = 250;

const optionLabel = (page: Pick<LayoutPreviewPageOption, "title" | "path">) => {
    const title = page.title || "Untitled";
    return page.path ? `${title} (${page.path})` : title;
};

interface PendingSearch {
    timer: ReturnType<typeof setTimeout>;
    done: () => void;
}

class LayoutPreviewPagePresenterImpl implements PresenterAbstraction.Interface {
    private pages: LayoutPreviewPageOption[] = [];
    private selectedPageId: string | null = null;
    private selectedLabel: string | null = null;
    private searching = false;
    private loading = false;
    private editor: Editor<LayoutEditorDocument> | null = null;
    private entryId: string | null = null;
    // Bumped on every pick: a page load that finishes after another pick is ignored.
    private version = 0;
    // Bumped on every search: results that come in after a newer search are ignored.
    private searchVersion = 0;
    private pendingSearch: PendingSearch | null = null;

    constructor(
        private listPages: ListLayoutPreviewPagesUseCase.Interface,
        private getPage: GetLayoutPreviewPageUseCase.Interface,
        private storage: LayoutPreviewPageStorage.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<
            LayoutPreviewPagePresenterImpl,
            | "editor"
            | "listPages"
            | "getPage"
            | "storage"
            | "notifications"
            | "version"
            | "searchVersion"
            | "pendingSearch"
        >(
            this,
            {
                vm: computed,
                editor: false,
                version: false,
                searchVersion: false,
                pendingSearch: false,
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
        const selected =
            this.selectedPageId && this.selectedLabel
                ? { label: this.selectedLabel, value: this.selectedPageId }
                : null;

        // The picked page stays listed when a search doesn't find it, so the field can still show it.
        if (selected && !options.some(option => option.value === selected.value)) {
            options.unshift(selected);
        }

        return {
            options,
            selectedPageId: this.selectedPageId,
            selected,
            searching: this.searching,
            loading: this.loading
        };
    }

    init(editor: Editor<LayoutEditorDocument>) {
        const document = editor.getDocumentState().read();
        this.editor = editor;
        this.entryId = document.entryId;
        this.pages = [];
        this.selectedPageId = null;
        this.selectedLabel = null;

        void this.loadPages("");

        const remembered = this.storage.get(document.entryId);
        if (remembered) {
            void this.select(remembered);
        }

        return () => {
            this.version++;
            this.searchVersion++;
            this.cancelPendingSearch();
            this.editor = null;
        };
    }

    search(term: string) {
        this.cancelPendingSearch();
        this.searching = true;

        return new Promise<void>(resolve => {
            const timer = setTimeout(() => {
                this.pendingSearch = null;
                void this.loadPages(term).then(resolve);
            }, SEARCH_DELAY_MS);
            this.pendingSearch = { timer, done: resolve };
        });
    }

    async select(pageId: string | null) {
        const editor = this.editor;
        const entryId = this.entryId;
        if (!editor || !entryId) {
            return;
        }

        const current = ++this.version;
        this.selectedLabel = pageId ? this.findLabel(pageId) : null;
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
            runInAction(() => {
                // A remembered page that wasn't listed: label it by the loaded page.
                this.selectedLabel ??= optionLabel({
                    title: String(page.properties?.title ?? ""),
                    path: String(page.properties?.path ?? "")
                });
            });
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
                this.selectedLabel = null;
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

    private findLabel(pageId: string) {
        const page = this.pages.find(page => page.id === pageId);
        if (page) {
            return optionLabel(page);
        }
        return pageId === this.selectedPageId ? this.selectedLabel : null;
    }

    private cancelPendingSearch() {
        if (!this.pendingSearch) {
            return;
        }
        clearTimeout(this.pendingSearch.timer);
        this.pendingSearch.done();
        this.pendingSearch = null;
    }

    private async loadPages(search: string) {
        const current = ++this.searchVersion;
        this.searching = true;
        try {
            const pages = await this.listPages.execute(search);
            if (current !== this.searchVersion) {
                return;
            }
            runInAction(() => {
                this.pages = pages;
            });
        } catch (error) {
            if (current !== this.searchVersion) {
                return;
            }
            this.notifications.warning({
                title: "Could not list pages to preview the layout with",
                description: getLayoutErrorMessage(error)
            });
        } finally {
            runInAction(() => {
                if (current === this.searchVersion) {
                    this.searching = false;
                }
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
