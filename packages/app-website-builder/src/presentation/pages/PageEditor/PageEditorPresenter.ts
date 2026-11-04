import { computed, makeAutoObservable, observableRef, runInAction } from "mobx";
import {
    type EditorPage,
    GlobalComponentLanguage,
    type PageLayout
} from "@webiny/website-builder-sdk";
import type { Page } from "~/domain/Page/index.js";
import { GetSettingsUseCase } from "~/features/settings/getSettings/abstractions/index.js";
import { GetPageUseCase } from "~/features/pages/getPage/abstractions.js";
import { GetPageLayoutUseCase } from "~/features/layouts/getPageLayout/index.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/listGlobalComponents/index.js";
import { PageGlobalComponentsPresenter } from "./GlobalComponents/abstractions.js";
import { PageEditorPresenter as PresenterAbstraction } from "./abstractions.js";

const getPageDataFromPage = (page: Page): EditorPage => {
    return {
        ...page,
        id: page.id,
        version: page.version,
        status: page.status,
        location: page.location,
        properties: page.properties as EditorPage["properties"],
        bindings: page.bindings,
        elements: page.elements,
        metadata: page.metadata,
        state: {}
    };
};

const getErrorMessage = (error: unknown) => {
    return error instanceof Error && error.message ? error.message : "Could not load the page.";
};

class PageEditorPresenterImpl implements PresenterAbstraction.Interface {
    private page: EditorPage | null = null;
    private error: string | null = null;
    // The page being loaded: a load for another page finishing later is ignored.
    private loadingId: string | null = null;

    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private getPage: GetPageUseCase.Interface,
        private getPageLayout: GetPageLayoutUseCase.Interface,
        private listGlobalComponents: ListGlobalComponentsUseCase.Interface,
        private globalComponents: PageGlobalComponentsPresenter.Interface
    ) {
        makeAutoObservable<
            PageEditorPresenterImpl,
            | "page"
            | "getSettings"
            | "getPage"
            | "getPageLayout"
            | "listGlobalComponents"
            | "globalComponents"
        >(
            this,
            {
                vm: computed,
                page: observableRef,
                getSettings: false,
                getPage: false,
                getPageLayout: false,
                listGlobalComponents: false,
                globalComponents: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: !this.page && !this.error,
            error: this.error,
            page: this.page
        };
    }

    async load(id: string) {
        this.loadingId = id;
        this.page = null;
        this.error = null;

        try {
            const [, page] = await Promise.all([
                this.getSettings.execute(),
                this.getPage.execute({ id }).then(page => this.compose(getPageDataFromPage(page)))
            ]);
            runInAction(() => {
                if (this.loadingId === id) {
                    this.page = page;
                }
            });
        } catch (error) {
            runInAction(() => {
                if (this.loadingId === id) {
                    this.error = getErrorMessage(error);
                }
            });
        }
    }

    private async compose(page: EditorPage) {
        // The page may come from the cache, with the layout as it was then: its published version
        // may have changed since. If it can't be loaded, the page opens with the layout it came with.
        const layoutId = page.properties.layout;
        if (layoutId) {
            page.layout = await this.getPageLayout
                .execute(layoutId, page.properties.language || null)
                .then(
                    (layout): PageLayout | null =>
                        layout && {
                            id: layout.id,
                            entryId: layout.entryId,
                            properties: layout.properties,
                            elements: layout.elements,
                            bindings: layout.bindings
                        }
                )
                .catch(() => page.layout);
        }
        // The global components in the page's language, or else "default". If they can't be
        // loaded, the page opens with their manifest defaults, and they can't be saved.
        const records = await this.listGlobalComponents
            .execute({
                language: GlobalComponentLanguage.from(page.properties.language).toString(),
                fallback: true
            })
            .catch(() => null);

        return this.globalComponents.prepare(page, records);
    }
}

export const PageEditorPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: PageEditorPresenterImpl,
    dependencies: [
        GetSettingsUseCase,
        GetPageUseCase,
        GetPageLayoutUseCase,
        ListGlobalComponentsUseCase,
        PageGlobalComponentsPresenter
    ]
});
