import { makeAutoObservable } from "mobx";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { createAppName } from "~/utils/appName.js";
import { CmsContentReviewsPresenter as Abstraction } from "./abstractions.js";
import type { CmsContentTypeOption } from "./abstractions.js";
import type { ContentType } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";
import { toContentTypes } from "./toContentTypes.js";

class CmsContentReviewsPresenterImpl implements Abstraction.Interface {
    private _loading = true;
    private _contentTypes: ContentType[] = [];
    private started = false;

    constructor(
        private listModels: ListModelsUseCase.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<CmsContentReviewsPresenterImpl, "listModels" | "notifications">(this, {
            listModels: false,
            notifications: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const namespaces = this._contentTypes.map(contentType => {
            return createAppName(contentType);
        });
        const options: CmsContentTypeOption[] = this._contentTypes.map(contentType => {
            return { label: contentType.name, value: contentType.modelId };
        });

        return { loading: this._loading, namespaces, options };
    }

    async init(): Promise<void> {
        // StrictMode runs effects twice; the model list is fetched once per presenter.
        if (this.started) {
            return;
        }
        this.started = true;
        try {
            const models = await this.listModels.execute();
            this.applyModels(models);
        } catch {
            this.applyFailure();
            // Without the model list the list has no namespaces to follow: say so once.
            this.notifications.error({
                title: "Could not load the content types",
                description: "Content Reviews will not update live. Reload the page to try again."
            });
        }
    }

    private applyModels(models: ListedModel[]): void {
        this._contentTypes = toContentTypes(models);
        this._loading = false;
    }

    private applyFailure(): void {
        this._contentTypes = [];
        this._loading = false;
    }
}

export const CmsContentReviewsPresenter = Abstraction.createImplementation({
    implementation: CmsContentReviewsPresenterImpl,
    dependencies: [ListModelsUseCase, Notifications]
});
