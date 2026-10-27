import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import type { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { pageToEditorDocument } from "@webiny/app-website-builder/presentation/pages/PageEditor/pageDocument.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

/*
 * Reloads the page a review is tracking after an AI or automation step may have changed it
 * (R262). The page editor cannot be dirty during a review (autosave is off), so only the revision
 * timestamps decide. `GetPageRepository` returns the `FullPageCache` entry first (A96), so the
 * page is evicted before it is read. The editor is updated in place; the review presenter is never
 * initialised again. `true` means the reloaded page differs from the loaded one.
 */
export class WbPageContentReloader implements IReviewContentReloader {
    constructor(
        private readonly editor: Editor<IPageEditorDocument>,
        private readonly cache: FullPageCache.Interface,
        private readonly getPage: GetPageUseCase.Interface
    ) {}

    async reload(): Promise<boolean> {
        const document = this.editor.getDocumentState().read();
        const pageId = document.id;

        // The cached page is the newest state the client knows (autosave and publish keep it
        // current); the document is the fallback.
        let loadedSavedOn = document.savedOn;
        let loadedModifiedOn = document.modifiedOn ?? "";
        const cached = this.cache.getItem(item => item.id === pageId);

        if (cached) {
            loadedSavedOn = cached.savedOn;
            loadedModifiedOn = cached.modifiedOn;
        }

        this.cache.removeItems(item => item.id === pageId);

        const page = await this.getPage.execute({ id: pageId });

        const sameSavedOn = page.savedOn === loadedSavedOn;
        const sameModifiedOn = page.modifiedOn === loadedModifiedOn;

        if (sameSavedOn && sameModifiedOn) {
            return false;
        }

        const next = pageToEditorDocument(page);

        this.editor.updateDocument(state => {
            state.properties = next.properties;
            state.bindings = next.bindings;
            state.elements = next.elements;
            state.metadata = next.metadata;
            state.extensions = next.extensions;
            state.savedOn = page.savedOn;
            state.modifiedOn = page.modifiedOn;
        });

        return true;
    }
}
