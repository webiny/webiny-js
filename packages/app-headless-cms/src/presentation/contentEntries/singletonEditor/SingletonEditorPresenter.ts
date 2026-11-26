import { makeAutoObservable, runInAction } from "mobx";
import { RouterRepository } from "@webiny/app/features/router/abstractions.js";
import type { CmsModel } from "~/types.js";
import { Routes } from "~/routes.js";
import { GetLatestSingletonEntryUseCase } from "~/features/contentEntry/singletonEditor/getLatest/abstractions.js";
import { SingletonEditorPresenter as Abstraction } from "./abstractions.js";

class SingletonEditorPresenterImpl implements Abstraction.Interface {
    private entryId: string | null = null;
    private loading = false;
    private error: string | null = null;
    private hasFields = false;

    constructor(
        private readonly router: RouterRepository.Interface,
        private readonly getLatestSingletonEntryUseCase: GetLatestSingletonEntryUseCase.Interface
    ) {
        makeAutoObservable<
            SingletonEditorPresenterImpl,
            "router" | "getLatestSingletonEntryUseCase"
        >(this, {
            router: false,
            getLatestSingletonEntryUseCase: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            entryId: this.entryId,
            loading: this.loading,
            error: this.error,
            hasFields: this.hasFields
        };
    }

    async init(model: CmsModel, routeEntryId: string | undefined): Promise<void> {
        this.hasFields = model.fields.length > 0;
        this.error = null;

        if (!this.hasFields) {
            this.entryId = null;
            return;
        }

        if (routeEntryId) {
            this.entryId = routeEntryId;
            return;
        }

        this.loading = true;
        const result = await this.getLatestSingletonEntryUseCase.execute(model);

        if (result.isFail()) {
            runInAction(() => {
                this.error = result.error.message;
                this.loading = false;
            });
            return;
        }

        const entry = result.value;
        runInAction(() => {
            this.entryId = entry.id;
            this.loading = false;
        });
        this.router.replaceRoute(Routes.ContentEntries.List, {
            modelId: model.modelId,
            id: entry.id
        });
    }

    dispose(): void {
        this.entryId = null;
        this.loading = false;
        this.error = null;
        this.hasFields = false;
    }
}

export const SingletonEditorPresenter = Abstraction.createImplementation({
    implementation: SingletonEditorPresenterImpl,
    dependencies: [RouterRepository, GetLatestSingletonEntryUseCase]
});
